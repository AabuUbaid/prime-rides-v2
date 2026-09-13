from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from . import services

from .models import Progression
from .serializers import (
    ProgressionSerializer,
    ProgressionUpdateSerializer,
    ProgressionAdvanceSerializer,
)
from .services import (
    get_progression,
    list_progressions,
)


class ProgressionListView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        queryset = list_progressions(
            user=request.user,
        )

        return Response(
            {
                "success": True,
                "data": ProgressionSerializer(
                    queryset,
                    many=True,
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class ProgressionDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get_object(self, pk, user):
        return get_progression(
            pk=pk,
            user=user,
        )

    def get(self, request, pk):
        progression = self.get_object(
            pk,
            request.user,
        )

        return Response(
            {
                "success": True,
                "data": ProgressionSerializer(
                    progression,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        if request.user.role not in {
            "MASTER",
            "ADMIN",
        }:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Only Master or Admin can "
                        "update Progression details."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        progression = self.get_object(
            pk,
            request.user,
        )

        serializer = ProgressionUpdateSerializer(
            progression,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        serializer.save()

        return Response(
            {
                "success": True,
                "message": (
                    "Progression updated successfully."
                ),
                "data": ProgressionSerializer(
                    progression,
                ).data,
            },
            status=status.HTTP_200_OK,
        )
        
class ProgressionAdvanceView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request, pk):
        if request.user.role not in {
            "MASTER",
            "ADMIN",
        }:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Only Master or Admin can "
                        "advance Progression."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        progression = get_progression(
            pk=pk,
            user=request.user,
        )

        serializer = ProgressionAdvanceSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            progression = (
                services.advance_progression_stage(
                    progression=progression,
                    user=request.user,
                    override_balance_gate=serializer.validated_data.get(
                        "override_balance_gate",
                        False,
                    ),
                    override_reason=serializer.validated_data.get(
                        "reason",
                    ),
                )
            )

        except ValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": str(exc.detail)
                    if hasattr(exc, "detail")
                    else str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": "Progression advanced successfully.",
                "data": ProgressionSerializer(
                    progression,
                ).data,
            },
            status=status.HTTP_200_OK,
        )