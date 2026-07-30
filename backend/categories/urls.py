"""URL routing for the categories API."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"categories", views.CategoryViewSet, basename="category")
router.register(r"fields", views.FieldDefinitionViewSet, basename="field-definition")
router.register(r"category-fields", views.CategoryFieldViewSet, basename="category-field")
router.register(r"field-options", views.FieldOptionViewSet, basename="field-option")
router.register(r"field-conditions", views.FieldConditionViewSet, basename="field-condition")

urlpatterns = [
    path("", include(router.urls)),
]
