"""Service helpers for categories (keeps views thin)."""

from .models import Category


def get_active_categories():
    """Return active categories annotated with field count."""
    from django.db.models import Count

    return (
        Category.objects
        .filter(is_active=True)
        .annotate(field_count=Count("category_fields"))
    )


def get_all_categories():
    """Return all categories annotated with field count."""
    from django.db.models import Count

    return (
        Category.objects
        .annotate(field_count=Count("category_fields"))
    )
