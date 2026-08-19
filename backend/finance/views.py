from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import selectors, services
from .models import Bank, EmiSheet
from .serializers import (
    BankSerializer,
    EmiCalculationSerializer,
    EmiSheetCreateSerializer,
    EmiSheetSerializer,
)

from accounts.permissions import IsMaster


# =========================================================
# BANK LIST / CREATE
# =========================================================


class BankListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsMaster()]

        return [IsAuthenticated()]

    def get(self, request):
        """
        Return banks.

        Master users can see all banks so that
        inactive banks can be reactivated.

        Other authenticated users only receive
        active banks for frontend financing use.
        """

        is_master = IsMaster().has_permission(
            request,
            self,
        )

        banks = selectors.list_banks(
            active_only=not is_master,
        )

        serializer = BankSerializer(
            banks,
            many=True,
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        """
        Create a bank.

        Master users only.
        """
        serializer = BankSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            bank = services.create_bank(
                name=serializer.validated_data[
                    "name"
                ],
                interest_rate=serializer.validated_data[
                    "interest_rate"
                ],
                is_cash=serializer.validated_data.get(
                    "is_cash",
                    False,
                ),
                is_active=serializer.validated_data.get(
                    "is_active",
                    True,
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
                "message": "Bank created successfully.",
                "data": BankSerializer(bank).data,
            },
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# BANK DETAIL / UPDATE
# =========================================================


class BankDetailView(APIView):
    permission_classes = [
        IsMaster,
    ]

    def patch(self, request, pk):
        """
        Update a bank.
        """

        bank = get_object_or_404(
            Bank,
            pk=pk,
        )

        serializer = BankSerializer(
            bank,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            bank = services.update_bank(
                bank=bank,
                name=serializer.validated_data.get(
                    "name"
                ),
                interest_rate=serializer.validated_data.get(
                    "interest_rate"
                ),
                is_cash=serializer.validated_data.get(
                    "is_cash"
                ),
                is_active=serializer.validated_data.get(
                    "is_active"
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
                "message": "Bank updated successfully.",
                "data": BankSerializer(bank).data,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# EMI CALCULATE
# =========================================================


class EmiCalculateView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request):
        """
        Calculate an EMI without saving it.
        """

        serializer = EmiCalculationSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            result = services.calculate_emi(
                **serializer.validated_data
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
                "data": result,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# EMI LIST / CREATE
# =========================================================


class EmiSheetListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        """
        Return saved EMI sheets.
        """

        queryset = (
            EmiSheet.objects
            .select_related(
                "car",
                "bank",
            )
            .prefetch_related(
                "expenses",
            )
            .all()
        )

        # -------------------------------------------------
        # Search
        # -------------------------------------------------

        search = request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                Q(emi_number__icontains=search)
                | Q(customer_name__icontains=search)
                | Q(customer_mobile__icontains=search)
                | Q(vehicle_stock_id__icontains=search)
                | Q(vehicle_make__icontains=search)
                | Q(vehicle_model__icontains=search)
                | Q(vehicle_variant__icontains=search)
                | Q(
                    vehicle_chassis_number__icontains=search
                )
                | Q(
                    vehicle_engine_number__icontains=search
                )
            )

        # -------------------------------------------------
        # Status filter
        # -------------------------------------------------

        status_filter = request.query_params.get(
            "status"
        )

        if status_filter:
            queryset = queryset.filter(
                status=status_filter
            )

        # -------------------------------------------------
        # Bank filter
        # -------------------------------------------------

        bank_filter = request.query_params.get(
            "bank"
        )

        if bank_filter:
            queryset = queryset.filter(
                bank_id=bank_filter
            )

        serializer = EmiSheetSerializer(
            queryset,
            many=True,
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        """
        Create and persist an EMI sheet.
        """

        serializer = EmiSheetCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            emi_sheet = services.create_emi_sheet(
                **serializer.validated_data
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = EmiSheetSerializer(
            emi_sheet,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "EMI sheet created successfully."
                ),
                "data": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# EMI DETAIL / DELETE
# =========================================================


class EmiSheetDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request, pk):
        """
        Return one EMI sheet.
        """

        emi_sheet = get_object_or_404(
            EmiSheet.objects
            .select_related(
                "car",
                "bank",
            )
            .prefetch_related(
                "expenses",
            ),
            pk=pk,
        )

        serializer = EmiSheetSerializer(
            emi_sheet,
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        """
        Delete an EMI sheet.
        Master-only.
        """

        permission = IsMaster()

        if not permission.has_permission(
            request,
            self,
        ):
            return Response(
                {
                    "success": False,
                    "message": (
                        "You do not have permission "
                        "to delete an EMI sheet."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        emi_sheet = get_object_or_404(
            EmiSheet,
            pk=pk,
        )

        emi_sheet.delete()

        return Response(
            {
                "success": True,
                "message": (
                    "EMI sheet deleted successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )