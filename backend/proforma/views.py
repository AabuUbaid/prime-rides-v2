from datetime import date

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from config.pagination import StandardResultsSetPagination
from accounts.permissions import IsMasterOrAdmin
from accounts.permissions import IsMaster
from insurance.models import Insurance

from .models import Proforma
from .serializers import (
    ProformaCreateSerializer,
    ProformaSerializer,
    ProformaUpdateSerializer,
)
from .services import (
    create_proforma,
    update_proforma,
)


class ProformaListCreateAPIView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request):
        queryset = (
            Proforma.objects
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
                Q(proforma_number__icontains=search)
                | Q(customer_name__icontains=search)
                | Q(customer_mobile__icontains=search)
                | Q(vehicle_chassis_number__icontains=search)
                | Q(vehicle_engine_number__icontains=search)
            )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)

        response = paginator.get_paginated_response(
            ProformaSerializer(page, many=True).data,
        )
        response.status_code = status.HTTP_200_OK
        return response

    def post(self, request):
        serializer = ProformaCreateSerializer(
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
            proforma = create_proforma(
                insurance=insurance,
                user=request.user,
                proforma_date=data.get(
                    "proforma_date",
                    date.today(),
                ),
                vat=data.get(
                    "vat",
                    0,
                ),
                bank_financed_by=data.get(
                    "bank_financed_by",
                    "",
                ),
                lpo=data.get(
                    "lpo",
                    "",
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
                "message": "Proforma created successfully.",
                "data": ProformaSerializer(
                    proforma,
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ProformaDetailAPIView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request, pk):
        proforma = get_object_or_404(
            Proforma.objects.select_related(
                "quote",
                "insurance",
                "created_by",
            ),
            pk=pk,
        )

        return Response(
            {
                "success": True,
                "data": ProformaSerializer(
                    proforma,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        proforma = get_object_or_404(
            Proforma,
            pk=pk,
        )

        serializer = ProformaUpdateSerializer(
            proforma,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(
            raise_exception=True,
        )

        try:
            proforma = update_proforma(
                proforma=proforma,
                data=serializer.validated_data,
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
                "message": "Proforma updated successfully.",
                "data": ProformaSerializer(
                    proforma,
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
                        "to delete Proformas."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        proforma = get_object_or_404(
            Proforma,
            pk=pk,
        )

        proforma.delete()

        return Response(
            {
                "success": True,
                "message": "Proforma deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )