"""
Serializers for listings.

ListingWriteSerializer handles creation with dynamic field values
and images in a single request (multipart/form-data).

ListingReadSerializer returns full listing detail including
dynamically-rendered category-specific attributes.
"""

from rest_framework import serializers
from django.db import transaction

from .models import Listing, ListingFieldValue, ListingImage
from .validators import validate_dynamic_fields
from categories.models import Category

import json


class ListingImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ListingImage
        fields = ["id", "image", "image_url", "is_primary", "display_order", "created_at"]
        read_only_fields = ["created_at"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        elif obj.image:
            return obj.image.url
        return None


class ListingFieldValueSerializer(serializers.Serializer):
    """Read-only representation of a dynamic attribute value."""

    field_id = serializers.IntegerField(source="category_field.id")
    key = serializers.CharField(source="category_field.key")
    label = serializers.CharField(source="category_field.label")
    field_type = serializers.CharField(source="category_field.field_definition.field_type")
    value = serializers.SerializerMethodField()
    display_value = serializers.CharField()

    def get_value(self, obj):
        """Return the raw typed value."""
        ft = obj.category_field.field_definition.field_type
        if ft == "boolean":
            return obj.value_boolean
        elif ft == "number":
            return float(obj.value_number) if obj.value_number is not None else None
        elif ft == "date":
            return str(obj.value_date) if obj.value_date else None
        elif ft == "checkbox":
            return obj.value_json
        else:
            return obj.value_text


class ListingReadSerializer(serializers.ModelSerializer):
    """Full listing representation for detail/list views."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)
    field_values = ListingFieldValueSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id", "category", "category_name", "category_slug",
            "title", "description", "price", "condition", "location",
            "status", "images", "primary_image", "field_values",
            "created_at", "updated_at",
        ]

    def get_primary_image(self, obj):
        """Return the URL of the primary image (or first image)."""
        request = self.context.get("request")
        primary = obj.images.filter(is_primary=True).first()
        if not primary:
            primary = obj.images.first()
        if primary and primary.image:
            if request:
                return request.build_absolute_uri(primary.image.url)
            return primary.image.url
        return None


class ListingWriteSerializer(serializers.ModelSerializer):
    """
    Handles listing creation with dynamic field values.

    Expects:
    - Standard listing fields (title, description, price, etc.)
    - `dynamic_fields`: JSON string of {category_field_id: value}
    - `images`: file uploads (multipart)
    """

    dynamic_fields = serializers.CharField(
        write_only=True, required=False, default="{}"
    )

    class Meta:
        model = Listing
        fields = [
            "id", "category", "title", "description", "price",
            "condition", "location", "status", "dynamic_fields",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_dynamic_fields(self, value):
        """Parse JSON string into dict."""
        if isinstance(value, dict):
            return value
        try:
            parsed = json.loads(value)
            if not isinstance(parsed, dict):
                raise serializers.ValidationError(
                    "dynamic_fields must be a JSON object."
                )
            return parsed
        except (json.JSONDecodeError, TypeError):
            raise serializers.ValidationError(
                "dynamic_fields must be valid JSON."
            )

    def validate(self, attrs):
        """Run dynamic field validation against category schema."""
        category = attrs.get("category")
        dynamic_fields = attrs.get("dynamic_fields", {})

        if category and dynamic_fields:
            cleaned, errors = validate_dynamic_fields(category, dynamic_fields)
            if errors:
                raise serializers.ValidationError({"dynamic_fields": errors})
            attrs["_cleaned_dynamic"] = cleaned

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        """Create listing + dynamic values + images atomically."""
        dynamic_fields = validated_data.pop("dynamic_fields", {})
        cleaned_dynamic = validated_data.pop("_cleaned_dynamic", [])

        listing = Listing.objects.create(**validated_data)

        # Store dynamic field values
        for item in cleaned_dynamic:
            cf = item["category_field"]
            field_type = item["field_type"]
            value = item["value"]

            kwargs = {"listing": listing, "category_field": cf}

            if field_type == "boolean":
                kwargs["value_boolean"] = value
            elif field_type == "number":
                kwargs["value_number"] = value
            elif field_type == "date":
                kwargs["value_date"] = value
            elif field_type == "checkbox":
                kwargs["value_json"] = value
            else:
                kwargs["value_text"] = str(value)

            ListingFieldValue.objects.create(**kwargs)

        # Handle image uploads from request
        request = self.context.get("request")
        if request:
            images = request.FILES.getlist("images")
            for idx, img in enumerate(images):
                ListingImage.objects.create(
                    listing=listing,
                    image=img,
                    is_primary=(idx == 0),
                    display_order=idx,
                )

        return listing
