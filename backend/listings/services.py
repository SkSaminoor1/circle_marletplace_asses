"""Service helpers for listings."""

from .models import Listing


def get_listing_queryset():
    """
    Return optimized listing queryset with all related data
    prefetched to minimize N+1 queries.
    """
    return (
        Listing.objects
        .select_related("category")
        .prefetch_related(
            "images",
            "field_values__category_field__field_definition",
            "field_values__category_field__options",
        )
    )
