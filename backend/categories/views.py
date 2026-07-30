"""
Views for category and field-definition management.

Provides CRUD endpoints for:
- Categories
- FieldDefinitions (reusable field types)
- CategoryFields (per-category field configuration)
- Dedicated endpoint for fetching a category's full field config
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count

from .models import Category, FieldDefinition, CategoryField, FieldOption, FieldCondition
from .serializers import (
    CategoryListSerializer,
    CategoryDetailSerializer,
    FieldDefinitionSerializer,
    CategoryFieldReadSerializer,
    CategoryFieldWriteSerializer,
    FieldOptionSerializer,
    FieldConditionSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD for marketplace categories.

    list:   GET  /api/categories/           — all categories (with field_count)
    create: POST /api/categories/
    read:   GET  /api/categories/{id}/      — full detail with nested fields
    update: PATCH/PUT /api/categories/{id}/
    delete: DELETE /api/categories/{id}/
    fields: GET  /api/categories/{id}/fields/ — field config for form engine
    """

    queryset = Category.objects.annotate(field_count=Count("category_fields"))
    lookup_field = "id"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CategoryDetailSerializer
        return CategoryListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Allow filtering by is_active via query param
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ("true", "1"))
        return qs

    @action(detail=True, methods=["get"], url_path="fields")
    def fields(self, request, id=None):
        """
        GET /api/categories/{id}/fields/

        Returns the full field configuration for a category — this is the
        primary endpoint consumed by the frontend dynamic form engine.
        """
        category = self.get_object()
        category_fields = (
            category.category_fields
            .select_related("field_definition")
            .prefetch_related("options", "conditions__depends_on")
            .order_by("display_order", "id")
        )
        serializer = CategoryFieldReadSerializer(category_fields, many=True)
        return Response(serializer.data)


class FieldDefinitionViewSet(viewsets.ModelViewSet):
    """
    CRUD for reusable field definitions.

    These are "templates" that describe a field's type. They can be
    attached to multiple categories via CategoryField.
    """

    queryset = FieldDefinition.objects.all()
    serializer_class = FieldDefinitionSerializer
    lookup_field = "id"
    filterset_fields = ["field_type"]
    search_fields = ["name"]


class CategoryFieldViewSet(viewsets.ModelViewSet):
    """
    CRUD for per-category field configuration.

    POST   /api/category-fields/         — assign a field to a category
    PATCH  /api/category-fields/{id}/    — update config
    DELETE /api/category-fields/{id}/    — unassign
    """

    queryset = (
        CategoryField.objects
        .select_related("field_definition", "category")
        .prefetch_related("options", "conditions__depends_on")
    )
    lookup_field = "id"

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return CategoryFieldReadSerializer
        return CategoryFieldWriteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get("category")
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs


class FieldOptionViewSet(viewsets.ModelViewSet):
    """Manage options for select/radio/checkbox fields."""

    queryset = FieldOption.objects.select_related("category_field")
    serializer_class = FieldOptionSerializer
    lookup_field = "id"

    def get_queryset(self):
        qs = super().get_queryset()
        category_field_id = self.request.query_params.get("category_field")
        if category_field_id:
            qs = qs.filter(category_field_id=category_field_id)
        return qs

    def perform_create(self, serializer):
        category_field_id = self.request.data.get("category_field")
        serializer.save(category_field_id=category_field_id)


class FieldConditionViewSet(viewsets.ModelViewSet):
    """Manage conditional-visibility rules."""

    queryset = FieldCondition.objects.select_related(
        "category_field", "depends_on"
    )
    serializer_class = FieldConditionSerializer
    lookup_field = "id"

    def get_queryset(self):
        qs = super().get_queryset()
        category_field_id = self.request.query_params.get("category_field")
        if category_field_id:
            qs = qs.filter(category_field_id=category_field_id)
        return qs

    def perform_create(self, serializer):
        category_field_id = self.request.data.get("category_field")
        serializer.save(category_field_id=category_field_id)
