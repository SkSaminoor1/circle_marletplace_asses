"""Shared utilities for Circle Marketplace."""

from rest_framework.response import Response
from rest_framework import status


def error_response(message, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    """Build a consistent error response payload."""
    payload = {"error": message}
    if errors:
        payload["details"] = errors
    return Response(payload, status=status_code)


def success_response(data=None, message=None, status_code=status.HTTP_200_OK):
    """Build a consistent success response payload."""
    payload = {}
    if message:
        payload["message"] = message
    if data is not None:
        payload["data"] = data
    return Response(payload or data, status=status_code)
