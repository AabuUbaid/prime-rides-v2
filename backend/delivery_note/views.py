from datetime import date

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from config.pagination import StandardResultsSetPagination

from accounts.permissions import IsMaster
from insurance.models import Insurance
from accounts.permissions import IsMasterOrAdmin
from .models import DeliveryNote
from .serializers import (
    DeliveryNoteCreateSerializer,
    DeliveryNoteSerializer,
    DeliveryNoteUpdateSerializer,
)
from .services import (
    create_delivery_note,
    update_delivery_note,
)


class DeliveryNoteListCreateAPIView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request):
        queryset = (
            DeliveryNote.objects
            .select_related(
                "quote",
                "insurance",
                "created_by",
            )
            .all()
        )

        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(
                Q(delivery_note_number__icontains=search)
                | Q(customer_name__icontains=search)
                | Q(vehicle_chassis_number__icontains=search)
                | Q(vehicle_engine_number__icontains=search)
            )

        quote_id = request.query_params.get("quote_id")

        if quote_id:
            queryset = queryset.filter(
                quote_id=quote_id
            )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)

        response = paginator.get_paginated_response(
            DeliveryNoteSerializer(page, many=True).data,
        )
        response.status_code = status.HTTP_200_OK
        return response

    def post(self, request):
        serializer = DeliveryNoteCreateSerializer(
            data=request.data,
        )
        serializer.is_valid(
            raise_exception=True,
        )

        data = serializer.validated_data

        insurance = get_object_or_404(
            Insurance,
            pk=data["insurance"],
        )

        try:
            delivery_note = create_delivery_note(
                insurance=insurance,
                user=request.user,
                delivery_date=data.get(
                    "delivery_date",
                    date.today(),
                ),
                buyer_name=data.get(
                    "buyer_name",
                    "",
                ),
                buyer_signature=data.get(
                    "buyer_signature",
                    "",
                ),
                buyer_signature_date=data.get(
                    "buyer_signature_date",
                ),
            )
        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": (
                    "Delivery Note created successfully."
                ),
                "data": DeliveryNoteSerializer(
                    delivery_note,
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class DeliveryNoteDetailAPIView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request, pk):
        delivery_note = get_object_or_404(
            DeliveryNote.objects.select_related(
                "quote",
                "insurance",
                "created_by",
            ),
            pk=pk,
        )

        return Response(
            {
                "success": True,
                "data": DeliveryNoteSerializer(
                    delivery_note,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        delivery_note = get_object_or_404(
            DeliveryNote,
            pk=pk,
        )

        serializer = DeliveryNoteUpdateSerializer(
            delivery_note,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(
            raise_exception=True,
        )

        delivery_note = update_delivery_note(
            delivery_note=delivery_note,
            data=serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Delivery Note updated successfully."
                ),
                "data": DeliveryNoteSerializer(
                    delivery_note,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        if not IsMaster().has_permission(
            request,
            self,
        ):
            return Response(
                {
                    "success": False,
                    "message": (
                        "You do not have permission "
                        "to delete Delivery Notes."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        delivery_note = get_object_or_404(
            DeliveryNote,
            pk=pk,
        )

        delivery_note.delete()

        return Response(
            {
                "success": True,
                "message": (
                    "Delivery Note deleted successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )