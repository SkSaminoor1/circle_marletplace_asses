"""
Views for marketplace listings.

Provides listing CRUD with search, filtering, sorting, and
multipart image upload support.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend

from .models import Listing, ListingImage
from .serializers import (
    ListingReadSerializer,
    ListingWriteSerializer,
    ListingImageSerializer,
)
from .services import get_listing_queryset


class ListingViewSet(viewsets.ModelViewSet):
    """
    CRUD for marketplace listings.

    Supports:
    - Search by title (GET ?search=...)
    - Filter by category, condition, status (GET ?category=1&condition=new)
    - Sort by created_at, price (GET ?ordering=-price)
    - Image uploads via multipart/form-data
    """

    queryset = get_listing_queryset()
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["category", "condition", "status"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "price", "title"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ListingWriteSerializer
        return ListingReadSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Allow filtering by price range
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        listing = serializer.save()
        # Return full read representation
        read_serializer = ListingReadSerializer(
            listing, context={"request": request}
        )
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="images")
    def upload_images(self, request, pk=None):
        """
        POST /api/listings/{id}/images/
        Upload additional images to an existing listing.
        """
        listing = self.get_object()
        images = request.FILES.getlist("images")

        if not images:
            return Response(
                {"error": "No images provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_count = listing.images.count()
        created = []
        for idx, img in enumerate(images):
            li = ListingImage.objects.create(
                listing=listing,
                image=img,
                is_primary=(current_count == 0 and idx == 0),
                display_order=current_count + idx,
            )
            created.append(li)

        serializer = ListingImageSerializer(
            created, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path="images/(?P<image_id>[^/.]+)")
    def delete_image(self, request, pk=None, image_id=None):
        """DELETE /api/listings/{id}/images/{image_id}/"""
        listing = self.get_object()
        try:
            image = listing.images.get(id=image_id)
        except ListingImage.DoesNotExist:
            return Response(
                {"error": "Image not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
