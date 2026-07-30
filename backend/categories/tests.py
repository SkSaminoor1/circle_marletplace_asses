"""
Tests for the categories app.

Covers: category CRUD, field definition CRUD, category-field assignment,
option management, conditional field configuration, and the dynamic
configuration endpoint consumed by the frontend form engine.
"""

from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from .models import (
    Category,
    FieldDefinition,
    CategoryField,
    FieldOption,
    FieldCondition,
)


class CategoryModelTest(TestCase):
    """Model-level tests for Category."""

    def test_slug_auto_generated(self):
        cat = Category.objects.create(name="Mobile Phone")
        self.assertEqual(cat.slug, "mobile-phone")

    def test_unique_name(self):
        Category.objects.create(name="Laptop")
        with self.assertRaises(Exception):
            Category.objects.create(name="Laptop")


class CategoryAPITest(TestCase):
    """API tests for /api/categories/."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(
            name="Mobile Phone", description="Smartphones and feature phones"
        )

    def test_list_categories(self):
        resp = self.client.get("/api/categories/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data["results"]), 1)

    def test_create_category(self):
        resp = self.client.post("/api/categories/", {
            "name": "Laptop",
            "description": "Portable computers",
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["slug"], "laptop")

    def test_retrieve_category(self):
        resp = self.client.get(f"/api/categories/{self.category.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Mobile Phone")

    def test_update_category(self):
        resp = self.client.patch(
            f"/api/categories/{self.category.id}/",
            {"description": "Updated description"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.category.refresh_from_db()
        self.assertEqual(self.category.description, "Updated description")

    def test_deactivate_category(self):
        resp = self.client.patch(
            f"/api/categories/{self.category.id}/",
            {"is_active": False},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.category.refresh_from_db()
        self.assertFalse(self.category.is_active)

    def test_filter_active_categories(self):
        Category.objects.create(name="Inactive Cat", is_active=False)
        resp = self.client.get("/api/categories/?is_active=true")
        names = [c["name"] for c in resp.data["results"]]
        self.assertIn("Mobile Phone", names)
        self.assertNotIn("Inactive Cat", names)

    def test_delete_category(self):
        resp = self.client.delete(f"/api/categories/{self.category.id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Category.objects.filter(id=self.category.id).exists())


class FieldDefinitionAPITest(TestCase):
    """API tests for /api/fields/."""

    def setUp(self):
        self.client = APIClient()

    def test_create_text_field(self):
        resp = self.client.post("/api/fields/", {
            "name": "Brand",
            "field_type": "text",
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["field_type"], "text")

    def test_create_select_field(self):
        resp = self.client.post("/api/fields/", {
            "name": "Storage",
            "field_type": "select",
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_invalid_field_type(self):
        resp = self.client.post("/api/fields/", {
            "name": "Bad",
            "field_type": "invalid_type",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_fields(self):
        FieldDefinition.objects.create(name="Brand", field_type="text")
        FieldDefinition.objects.create(name="RAM", field_type="select")
        resp = self.client.get("/api/fields/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data["results"]), 2)

    def test_filter_by_type(self):
        FieldDefinition.objects.create(name="Brand", field_type="text")
        FieldDefinition.objects.create(name="RAM", field_type="select")
        resp = self.client.get("/api/fields/?field_type=text")
        self.assertEqual(len(resp.data["results"]), 1)


class CategoryFieldAPITest(TestCase):
    """API tests for category-field assignment and configuration."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Mobile Phone")
        self.field_def = FieldDefinition.objects.create(
            name="Brand", field_type="text"
        )

    def test_assign_field_to_category(self):
        resp = self.client.post("/api/category-fields/", {
            "category": self.category.id,
            "field_definition": self.field_def.id,
            "label": "Brand",
            "key": "brand",
            "required": True,
            "display_order": 1,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_assign_field_with_validation(self):
        resp = self.client.post("/api/category-fields/", {
            "category": self.category.id,
            "field_definition": self.field_def.id,
            "label": "Brand",
            "key": "brand",
            "required": True,
            "min_length": 2,
            "max_length": 50,
            "display_order": 1,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        cf = CategoryField.objects.get(id=resp.data["id"])
        self.assertEqual(cf.min_length, 2)
        self.assertEqual(cf.max_length, 50)

    def test_assign_field_with_options(self):
        storage_def = FieldDefinition.objects.create(
            name="Storage", field_type="select"
        )
        resp = self.client.post("/api/category-fields/", {
            "category": self.category.id,
            "field_definition": storage_def.id,
            "label": "Storage",
            "key": "storage",
            "required": True,
            "display_order": 2,
            "options": [
                {"label": "64 GB", "value": "64"},
                {"label": "128 GB", "value": "128"},
                {"label": "256 GB", "value": "256"},
            ],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        cf = CategoryField.objects.get(id=resp.data["id"])
        self.assertEqual(cf.options.count(), 3)

    def test_duplicate_key_rejected(self):
        CategoryField.objects.create(
            category=self.category,
            field_definition=self.field_def,
            label="Brand",
            key="brand",
        )
        resp = self.client.post("/api/category-fields/", {
            "category": self.category.id,
            "field_definition": self.field_def.id,
            "label": "Brand Duplicate",
            "key": "brand",
            "display_order": 2,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class CategoryFieldsEndpointTest(TestCase):
    """Tests for GET /api/categories/{id}/fields/ — the form-engine endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Mobile Phone")
        fd_brand = FieldDefinition.objects.create(name="Brand", field_type="text")
        fd_storage = FieldDefinition.objects.create(name="Storage", field_type="select")

        self.cf_brand = CategoryField.objects.create(
            category=self.category,
            field_definition=fd_brand,
            label="Brand",
            key="brand",
            required=True,
            display_order=1,
        )
        self.cf_storage = CategoryField.objects.create(
            category=self.category,
            field_definition=fd_storage,
            label="Storage",
            key="storage",
            required=True,
            display_order=2,
        )
        FieldOption.objects.create(
            category_field=self.cf_storage, label="64 GB", value="64", display_order=0
        )
        FieldOption.objects.create(
            category_field=self.cf_storage, label="128 GB", value="128", display_order=1
        )

    def test_fields_endpoint_returns_config(self):
        resp = self.client.get(f"/api/categories/{self.category.id}/fields/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_fields_include_type_and_options(self):
        resp = self.client.get(f"/api/categories/{self.category.id}/fields/")
        storage_field = next(f for f in resp.data if f["key"] == "storage")
        self.assertEqual(storage_field["field_type"], "select")
        self.assertEqual(len(storage_field["options"]), 2)

    def test_fields_ordered_by_display_order(self):
        resp = self.client.get(f"/api/categories/{self.category.id}/fields/")
        keys = [f["key"] for f in resp.data]
        self.assertEqual(keys, ["brand", "storage"])


class ConditionalFieldTest(TestCase):
    """Tests for conditional field configuration."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Mobile Phone")
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
            display_order=1,
        )
        self.cf_expiry = CategoryField.objects.create(
            category=self.category,
            field_definition=fd_expiry,
            label="Warranty Expiry Date",
            key="warranty_expiry",
            display_order=2,
        )
        FieldCondition.objects.create(
            category_field=self.cf_expiry,
            depends_on=self.cf_warranty,
            operator="equals",
            value="true",
        )

    def test_condition_included_in_fields_endpoint(self):
        resp = self.client.get(f"/api/categories/{self.category.id}/fields/")
        expiry = next(f for f in resp.data if f["key"] == "warranty_expiry")
        self.assertEqual(len(expiry["conditions"]), 1)
        cond = expiry["conditions"][0]
        self.assertEqual(cond["operator"], "equals")
        self.assertEqual(cond["value"], "true")
        self.assertEqual(cond["depends_on_key"], "under_warranty")
