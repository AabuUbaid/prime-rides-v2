from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.response import Response


def api_success(
    message: str,
    data: Any = None,
    *,
    status_code: int = status.HTTP_200_OK,
) -> Response:
    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
        },
        status=status_code,
    )


def api_error(
    message: str,
    errors: Any = None,
    *,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> Response:
    return Response(
        {
            "success": False,
            "message": message,
            "errors": errors,
        },
        status=status_code,
    )
