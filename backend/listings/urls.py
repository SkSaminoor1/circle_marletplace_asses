"""URL routing for the listings API."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"listings", views.ListingViewSet, basename="listing")

urlpatterns = [
    path("", include(router.urls)),
]
