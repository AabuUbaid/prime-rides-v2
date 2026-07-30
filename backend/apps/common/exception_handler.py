from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import exception_handler

from apps.common.responses import api_error


def custom_exception_handler(exc, context):
    if isinstance(exc, DjangoValidationError):
        errors = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
        return api_error(
            "Validation failed.",
            errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    response = exception_handler(exc, context)

    if response is None:
        return None

    if isinstance(exc, Http404):
        message = "Resource not found."
    elif isinstance(exc, PermissionDenied):
        message = "Permission denied."
    else:
        detail = response.data.get("detail") if isinstance(response.data, dict) else None
        message = str(detail or "Request failed.")

    return api_error(
        message,
        response.data,
        status_code=response.status_code,
    )
