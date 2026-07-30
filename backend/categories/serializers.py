"""
Serializers for the category / field-definition schema system.

Handles nested creation of options and conditions within CategoryField,
and exposes a rich configuration endpoint that the frontend form engine
consumes to render dynamic fields.
"""

from rest_framework import serializers
from .models import (
    Category,
    FieldDefinition,
    CategoryField,
    FieldOption,
    FieldCondition,
)


# ──────────────────────────────────────────────
# Leaf serializers
# ──────────────────────────────────────────────

class FieldOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldOption
        fields = ["id", "label", "value", "display_order"]


class FieldConditionSerializer(serializers.ModelSerializer):
    depends_on_key = serializers.CharField(
        source="depends_on.key", read_only=True
    )

    class Meta:
        model = FieldCondition
        fields = ["id", "depends_on", "depends_on_key", "operator", "value"]


# ──────────────────────────────────────────────
# FieldDefinition
# ──────────────────────────────────────────────

class FieldDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldDefinition
        fields = [
            "id", "name", "field_type", "description",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


# ──────────────────────────────────────────────
# CategoryField — full config used by form engine
# ──────────────────────────────────────────────

class CategoryFieldReadSerializer(serializers.ModelSerializer):
    """
    Read-only representation returned by GET /api/categories/{id}/fields/.
    Includes nested options, conditions, and the underlying field_type.
    """

    field_type = serializers.CharField(
        source="field_definition.field_type", read_only=True
    )
    field_name = serializers.CharField(
        source="field_definition.name", read_only=True
    )
    options = FieldOptionSerializer(many=True, read_only=True)
    conditions = FieldConditionSerializer(many=True, read_only=True)

    class Meta:
        model = CategoryField
        fields = [
            "id",
            "field_definition",
            "field_type",
            "field_name",
            "label",
            "key",
            "placeholder",
            "help_text",
            "required",
            "display_order",
            "default_value",
            "min_value",
            "max_value",
            "min_length",
            "max_length",
            "options",
            "conditions",
        ]


class CategoryFieldWriteSerializer(serializers.ModelSerializer):
    """
    Write serializer for creating / updating a CategoryField.
    Options and conditions are managed via their own endpoints or
    passed as nested lists for convenience.
    """

    options = FieldOptionSerializer(many=True, required=False)
    conditions = FieldConditionSerializer(many=True, required=False)

    class Meta:
        model = CategoryField
        fields = [
            "id",
            "category",
            "field_definition",
            "label",
            "key",
            "placeholder",
            "help_text",
            "required",
            "display_order",
            "default_value",
            "min_value",
            "max_value",
            "min_length",
            "max_length",
            "options",
            "conditions",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "key": {"required": False, "allow_blank": True}
        }

    def run_validation(self, data=serializers.empty):
        if data is not serializers.empty:
            if hasattr(data, "copy"):
                data = data.copy()
            if not data.get("key") and data.get("label"):
                from django.utils.text import slugify
                data["key"] = slugify(data["label"]).replace("-", "_")
        return super().run_validation(data)

    def _save_options(self, category_field, options_data):
        """Replace all options atomically."""
        category_field.options.all().delete()
        for idx, opt in enumerate(options_data):
            FieldOption.objects.create(
                category_field=category_field,
                label=opt.get("label", ""),
                value=opt.get("value", ""),
                display_order=opt.get("display_order", idx),
            )

    def _save_conditions(self, category_field, conditions_data):
        """Replace all conditions atomically."""
        category_field.conditions.all().delete()
        for cond in conditions_data:
            depends_on = cond.get("depends_on")
            if isinstance(depends_on, CategoryField):
                depends_on_id = depends_on.id
            else:
                depends_on_id = depends_on
            FieldCondition.objects.create(
                category_field=category_field,
                depends_on_id=depends_on_id,
                operator=cond.get("operator", "equals"),
                value=cond.get("value", ""),
            )

    def create(self, validated_data):
        options_data = validated_data.pop("options", [])
        conditions_data = validated_data.pop("conditions", [])
        category_field = CategoryField.objects.create(**validated_data)
        if options_data:
            self._save_options(category_field, options_data)
        if conditions_data:
            self._save_conditions(category_field, conditions_data)
        return category_field

    def update(self, instance, validated_data):
        options_data = validated_data.pop("options", None)
        conditions_data = validated_data.pop("conditions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if options_data is not None:
            self._save_options(instance, options_data)
        if conditions_data is not None:
            self._save_conditions(instance, conditions_data)
        return instance


# ──────────────────────────────────────────────
# Category
# ──────────────────────────────────────────────

class CategoryListSerializer(serializers.ModelSerializer):
    """Compact serializer for listing categories."""

    field_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = [
            "id", "name", "slug", "description", "icon",
            "is_active", "field_count", "created_at", "updated_at",
        ]
        read_only_fields = ["slug", "created_at", "updated_at"]


class CategoryDetailSerializer(serializers.ModelSerializer):
    """Full serializer including nested field configuration."""

    category_fields = CategoryFieldReadSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = [
            "id", "name", "slug", "description", "icon",
            "is_active", "category_fields", "created_at", "updated_at",
        ]
        read_only_fields = ["slug", "created_at", "updated_at"]
