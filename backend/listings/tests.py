"""
Tests for the listings app.

Covers: listing creation, dynamic field validation (required, min/max,
option validation, boolean, date), conditional field validation,
listing retrieval with dynamic attributes, and API filtering.
"""

import json
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from categories.models import (
    Category, FieldDefinition, CategoryField, FieldOption, FieldCondition,
)
from .models import Listing, ListingFieldValue


class ListingCreationTest(TestCase):
    """Tests for creating listings with dynamic field values."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Mobile Phone")

        # Create field definitions
        self.fd_brand = FieldDefinition.objects.create(name="Brand", field_type="text")
        self.fd_storage = FieldDefinition.objects.create(name="Storage", field_type="select")
        self.fd_battery = FieldDefinition.objects.create(name="Battery Health", field_type="number")

        # Assign to category
        self.cf_brand = CategoryField.objects.create(
            category=self.category,
            field_definition=self.fd_brand,
            label="Brand",
            key="brand",
            required=True,
            display_order=1,
            min_length=2,
            max_length=50,
        )
        self.cf_storage = CategoryField.objects.create(
            category=self.category,
            field_definition=self.fd_storage,
            label="Storage",
            key="storage",
            required=True,
            display_order=2,
        )
        FieldOption.objects.create(category_field=self.cf_storage, label="64 GB", value="64")
        FieldOption.objects.create(category_field=self.cf_storage, label="128 GB", value="128")
        FieldOption.objects.create(category_field=self.cf_storage, label="256 GB", value="256")

        self.cf_battery = CategoryField.objects.create(
            category=self.category,
            field_definition=self.fd_battery,
            label="Battery Health (%)",
            key="battery_health",
            required=False,
            display_order=3,
            min_value=Decimal("0"),
            max_value=Decimal("100"),
        )

    def _listing_data(self, dynamic_fields=None):
        data = {
            "category": self.category.id,
            "title": "iPhone 14 Pro",
            "description": "Excellent condition, barely used.",
            "price": "899.99",
            "condition": "like_new",
            "location": "New York, NY",
            "dynamic_fields": json.dumps(dynamic_fields or {}),
        }
        return data

    def test_create_listing_success(self):
        data = self._listing_data({
            str(self.cf_brand.id): "Apple",
            str(self.cf_storage.id): "256",
            str(self.cf_battery.id): "91",
        })
        resp = self.client.post("/api/listings/", data, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["title"], "iPhone 14 Pro")

        # Verify dynamic values stored
        listing = Listing.objects.get(id=resp.data["id"])
        vals = {
            fv.category_field.key: fv.display_value
            for fv in listing.field_values.all()
        }
        self.assertEqual(vals["brand"], "Apple")
        self.assertEqual(vals["storage"], "256")

    def test_required_field_missing(self):
        data = self._listing_data({
            str(self.cf_storage.id): "128",
            # brand is required but missing
        })
        resp = self.client.post("/api/listings/", data, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_option_rejected(self):
        data = self._listing_data({
            str(self.cf_brand.id): "Apple",
            str(self.cf_storage.id): "512",  # not in options
        })
        resp = self.client.post("/api/listings/", data, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_min_length_validation(self):
        data = self._listing_data({
            str(self.cf_brand.id): "A",  # min_length is 2
            str(self.cf_storage.id): "128",
        })
        resp = self.client.post("/api/listings/", data, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_max_value_validation(self):
        data = self._listing_data({
            str(self.cf_brand.id): "Apple",
            str(self.cf_storage.id): "256",
            str(self.cf_battery.id): "150",  # max is 100
        })
        resp = self.client.post("/api/listings/", data, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_number_type_validation(self):
        data = self._listing_data({
            str(self.cf_brand.id): "Apple",
            str(self.cf_storage.id): "256",
            str(self.cf_battery.id): "not_a_number",
        })
        resp = self.client.post("/api/listings/", data, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class ConditionalFieldValidationTest(TestCase):
    """Tests for conditional field validation on listings."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Electronics")

        fd_warranty = FieldDefinition.objects.create(
            name="Under Warranty", field_type="boolean"
        )
        fd_expiry = FieldDefinition.objects.create(
            name="Warranty Expiry", field_type="date"
        )

        self.cf_warranty = CategoryField.objects.create(
            category=self.category,
            field_definition=fd_warranty,
            label="Under Warranty?",
            key="under_warranty",
            required=False,
            display_order=1,
        )
        self.cf_expiry = CategoryField.objects.create(
            category=self.category,
            field_definition=fd_expiry,
            label="Warranty Expiry Date",
            key="warranty_expiry",
            required=True,  # Required WHEN visible
            display_order=2,
        )
        # Condition: show expiry when warranty = true
        FieldCondition.objects.create(
            category_field=self.cf_expiry,
            depends_on=self.cf_warranty,
            operator="equals",
            value="true",
        )

    def _listing_data(self, dynamic_fields):
        return {
            "category": self.category.id,
            "title": "Test Product",
            "description": "Testing conditional fields",
            "price": "100.00",
            "condition": "good",
            "location": "Test City",
            "dynamic_fields": json.dumps(dynamic_fields),
        }

    def test_hidden_required_field_not_validated(self):
        """When warranty=false, expiry is hidden and not required."""
        data = self._listing_data({
            str(self.cf_warranty.id): "false",
            # warranty_expiry not provided — should be OK because hidden
        })
        resp = self.client.post("/api/listings/", data, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_visible_required_field_validated(self):
        """When warranty=true, expiry is visible and required."""
        data = self._listing_data({
            str(self.cf_warranty.id): "true",
            # warranty_expiry is required when visible but missing
        })
        resp = self.client.post("/api/listings/", data, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_visible_field_with_valid_date(self):
        """When warranty=true and expiry provided, should succeed."""
        data = self._listing_data({
            str(self.cf_warranty.id): "true",
            str(self.cf_expiry.id): "2025-12-31",
        })
        resp = self.client.post("/api/listings/", data, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_invalid_date_rejected(self):
        data = self._listing_data({
            str(self.cf_warranty.id): "true",
            str(self.cf_expiry.id): "not-a-date",
        })
        resp = self.client.post("/api/listings/", data, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class ListingRetrievalTest(TestCase):
    """Tests for listing retrieval with dynamic attributes."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Laptop")
        fd = FieldDefinition.objects.create(name="Processor", field_type="text")
        self.cf = CategoryField.objects.create(
            category=self.category,
            field_definition=fd,
            label="Processor",
            key="processor",
            display_order=1,
        )
        self.listing = Listing.objects.create(
            category=self.category,
            title="MacBook Pro",
            description="M2 chip",
            price=Decimal("1999.99"),
            condition="like_new",
            location="San Francisco",
        )
        ListingFieldValue.objects.create(
            listing=self.listing,
            category_field=self.cf,
            value_text="Apple M2 Pro",
        )

    def test_listing_detail_includes_dynamic_values(self):
        resp = self.client.get(f"/api/listings/{self.listing.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["title"], "MacBook Pro")
        fv = resp.data["field_values"]
        self.assertEqual(len(fv), 1)
        self.assertEqual(fv[0]["key"], "processor")
        self.assertEqual(fv[0]["value"], "Apple M2 Pro")

    def test_listing_list(self):
        resp = self.client.get("/api/listings/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data["results"]), 1)

    def test_filter_by_category(self):
        other_cat = Category.objects.create(name="Sofa")
        resp = self.client.get(f"/api/listings/?category={other_cat.id}")
        self.assertEqual(len(resp.data["results"]), 0)

    def test_filter_by_condition(self):
        resp = self.client.get("/api/listings/?condition=like_new")
        self.assertEqual(len(resp.data["results"]), 1)

    def test_search_by_title(self):
        resp = self.client.get("/api/listings/?search=MacBook")
        self.assertEqual(len(resp.data["results"]), 1)

    def test_ordering_by_price(self):
        Listing.objects.create(
            category=self.category,
            title="Cheap Laptop",
            description="Budget",
            price=Decimal("299.99"),
            condition="fair",
            location="Chicago",
        )
        resp = self.client.get("/api/listings/?ordering=price")
        prices = [Decimal(r["price"]) for r in resp.data["results"]]
        self.assertEqual(prices, sorted(prices))
