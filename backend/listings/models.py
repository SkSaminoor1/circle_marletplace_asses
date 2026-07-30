"""
Models for marketplace listings.

Listing        — common product information (title, price, condition, etc.)
ListingFieldValue — dynamic category-specific attribute values
ListingImage   — product images with ordering

The value storage strategy uses typed columns (value_text, value_number,
value_boolean, value_date, value_json) so each type can be stored natively.
This avoids string-parsing overhead and allows proper database-level
type safety while remaining fully dynamic.
"""

import os
import uuid
from django.db import models
from categories.models import Category, CategoryField


def listing_image_path(instance, filename):
    """Generate a unique upload path: media/listings/<listing_id>/<uuid>.<ext>"""
    ext = os.path.splitext(filename)[1]
    new_name = f"{uuid.uuid4().hex}{ext}"
    return f"listings/{instance.listing_id}/{new_name}"


class Listing(models.Model):
    """A product listing in the marketplace."""

    class Condition(models.TextChoices):
        NEW = "new", "New"
        LIKE_NEW = "like_new", "Like New"
        GOOD = "good", "Good"
        FAIR = "fair", "Fair"
        POOR = "poor", "Poor"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        SOLD = "sold", "Sold"
        ARCHIVED = "archived", "Archived"

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="listings",
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    condition = models.CharField(
        max_length=20, choices=Condition.choices, default=Condition.GOOD
    )
    location = models.CharField(max_length=200)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class ListingFieldValue(models.Model):
    """
    Stores a single dynamic attribute value for a listing.

    Each value is stored in the appropriate typed column based on
    the field definition's type. Only one column is populated per row.
    """

    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="field_values",
    )
    category_field = models.ForeignKey(
        CategoryField,
        on_delete=models.CASCADE,
        related_name="listing_values",
    )

    # Typed value columns — only one is populated per row
    value_text = models.TextField(blank=True, default="")
    value_number = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    value_boolean = models.BooleanField(null=True, blank=True)
    value_date = models.DateField(null=True, blank=True)
    # For checkbox/multiselect — stores a list of selected values
    value_json = models.JSONField(null=True, blank=True)

    class Meta:
        # Prevent duplicate values for the same listing/field combination
        unique_together = [("listing", "category_field")]

    def __str__(self):
        return f"{self.listing.title} — {self.category_field.label}: {self.display_value}"

    @property
    def display_value(self):
        """Return the human-readable value regardless of storage column."""
        field_type = self.category_field.field_definition.field_type

        if field_type == "boolean":
            if self.value_boolean is None:
                return ""
            return "Yes" if self.value_boolean else "No"
        elif field_type == "number":
            if self.value_number is not None:
                # Strip trailing zeros for clean display
                return str(self.value_number.normalize())
            return ""
        elif field_type == "date":
            return str(self.value_date) if self.value_date else ""
        elif field_type in ("checkbox",):
            if self.value_json:
                return ", ".join(str(v) for v in self.value_json)
            return ""
        else:
            return self.value_text or ""


class ListingImage(models.Model):
    """Product image with ordering and primary flag."""

    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to=listing_image_path)
    is_primary = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return f"Image for {self.listing.title} (order={self.display_order})"
