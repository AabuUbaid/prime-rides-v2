from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ProcurementCheck
from .procurement_serializers import ProcurementCheckSerializer
from .procurement_services import (
    create_procurement_check,
    update_procurement_check,
)


class ProcurementCheckListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = ProcurementCheck.objects.select_related(
            "car",
            "checked_by",
        ).all()

        serializer = ProcurementCheckSerializer(
            queryset,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = ProcurementCheckSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        procurement_check = create_procurement_check(
            validated_data=serializer.validated_data,
            checked_by=request.user,
        )

        response_serializer = ProcurementCheckSerializer(
            procurement_check
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class ProcurementCheckDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return ProcurementCheck.objects.select_related(
            "car",
            "checked_by",
        ).get(pk=pk)

    def get(self, request, pk):
        try:
            procurement_check = self.get_object(pk)
        except ProcurementCheck.DoesNotExist:
            return Response(
                {"detail": "Procurement check not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProcurementCheckSerializer(
            procurement_check
        )

        return Response(serializer.data)

    def delete(self, request, pk):
        if request.user.role != "MASTER":
            return Response(
                {
                    "detail": (
                        "Only MASTER users can delete "
                        "procurement checks."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            procurement_check = self.get_object(pk)
        except ProcurementCheck.DoesNotExist:
            return Response(
                {"detail": "Procurement check not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        procurement_check.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )
        
    def patch(self, request, pk):
        try:
            procurement_check = self.get_object(pk)
        except ProcurementCheck.DoesNotExist:
            return Response(
                {"detail": "Procurement check not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProcurementCheckSerializer(
            procurement_check,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        updated_check = update_procurement_check(
            procurement_check=procurement_check,
            validated_data=serializer.validated_data,
        )

        response_serializer = ProcurementCheckSerializer(
            updated_check
        )

        return Response(response_serializer.data)