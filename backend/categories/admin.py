"""Django Admin registration for categories (secondary admin tool)."""

from django.contrib import admin
from .models import (
    Category,
    FieldDefinition,
    CategoryField,
    FieldOption,
    FieldCondition,
)


class FieldOptionInline(admin.TabularInline):
    model = FieldOption
    extra = 1


class FieldConditionInline(admin.TabularInline):
    model = FieldCondition
    fk_name = "category_field"
    extra = 0


class CategoryFieldInline(admin.TabularInline):
    model = CategoryField
    extra = 0
    show_change_link = True


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [CategoryFieldInline]


@admin.register(FieldDefinition)
class FieldDefinitionAdmin(admin.ModelAdmin):
    list_display = ["name", "field_type", "created_at"]
    list_filter = ["field_type"]
    search_fields = ["name"]


@admin.register(CategoryField)
class CategoryFieldAdmin(admin.ModelAdmin):
    list_display = ["category", "label", "key", "required", "display_order"]
    list_filter = ["category", "required"]
    search_fields = ["label", "key"]
    inlines = [FieldOptionInline, FieldConditionInline]


@admin.register(FieldOption)
class FieldOptionAdmin(admin.ModelAdmin):
    list_display = ["category_field", "label", "value", "display_order"]


@admin.register(FieldCondition)
class FieldConditionAdmin(admin.ModelAdmin):
    list_display = ["category_field", "depends_on", "operator", "value"]
