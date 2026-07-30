"""URL routing for the demo wallet API."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"wallets", views.WalletViewSet, basename="wallet")

urlpatterns = [
    path("wallets/purchase/", views.purchase_listing, name="wallet-purchase"),
    path("", include(router.urls)),
]
