"""Django Admin registration for listings."""

from django.contrib import admin
from .models import Listing, ListingFieldValue, ListingImage


class ListingFieldValueInline(admin.TabularInline):
    model = ListingFieldValue
    extra = 0
    readonly_fields = ["category_field", "display_value"]


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 0


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "price", "condition", "status", "created_at"]
    list_filter = ["category", "condition", "status"]
    search_fields = ["title", "description"]
    inlines = [ListingFieldValueInline, ListingImageInline]


@admin.register(ListingFieldValue)
class ListingFieldValueAdmin(admin.ModelAdmin):
    list_display = ["listing", "category_field", "display_value"]
    list_filter = ["category_field__category"]


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    list_display = ["listing", "is_primary", "display_order", "created_at"]
