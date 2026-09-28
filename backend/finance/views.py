from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from decimal import Decimal

from django.db.models import (
    DecimalField,
    F,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce
from rest_framework import status , generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from config.pagination import StandardResultsSetPagination
from quotes.models import Quote
from customers.models import Customer
from inventory.models import Car
from datetime import datetime
from . import selectors, services
from .models import (
    Bank,
    BankProcessingConfiguration,
    EmiSheet,
    ExpensePreset,
    InsuranceBand,
    ServicePackage,
    BankLoan,
    BankLoanFollowUp,
    CashDeal,
    CashReceipt,
    BalanceSheet,
    
)
from accounts.permissions import IsMasterOrAdmin, IsMaster
from quotes.models import QuoteExpense

from .serializers import (
    BankSerializer,
    EmiCalculationSerializer,
    EmiSheetCreateSerializer,
    EmiSheetSerializer,
    BankProcessingConfigurationSerializer,
    ExpensePresetSerializer,
    InsuranceBandSerializer,
    ServicePackageSerializer,
    EmiSheetUpdateSerializer,
    BankLoanSerializer,
    BankLoanCreateSerializer,
    BankLoanStatusUpdateSerializer,
    BankLoanFinanceUpdateSerializer,
    BankLoanPriorityUpdateSerializer,
    BankLoanFollowUpSerializer,
    BankLoanFollowUpCreateSerializer,
    BankLoanApplicationStatusUpdateSerializer,
    BankLoanApplicationInfoUpdateSerializer,
    CashDealSerializer,
    CashDealCreateSerializer,
    CashDealUpdateSerializer,
    CashReceiptSerializer,
    CashReceiptCreateSerializer,
    CashReceiptUpdateSerializer,
    BalanceSheetSerializer,
    BalanceSheetListSerializer,
    BalanceSheetCreateSerializer,
    BalanceSheetMasterUpdateSerializer,
)

from .services import (
    create_bank_loan_from_quote,
    update_bank_loan_status,
    update_bank_loan_finance,
    update_bank_loan_priority,
    create_bank_loan_follow_up,
    create_bank_loan_with_new_bank,
    update_bank_loan_application_status,
    create_cash_deal,
    update_cash_deal_financials,
    reverse_cash_receipt,
    
)
from accounts.permissions import IsMaster


def _balance_sheet_queryset():
    receipt_queryset = CashReceipt.objects.select_related(
        "customer",
        "created_by",
    ).order_by(
        "transaction_date",
        "created_at",
    )
    expense_queryset = QuoteExpense.objects.filter(
        actual_amount__isnull=False,
        applies=True,
    ).order_by("created_at")
    bank_loan_queryset = BankLoan.objects.order_by(
        "-created_at",
    )

    return (
        BalanceSheet.objects
        .select_related(
            "customer",
            "quote",
            "quote__car",
            "quote__salesperson",
            "quote__emi_sheet",
            "quote__cash_deal",
            "car",
            "created_by",
        )
        .prefetch_related(
            Prefetch(
                "quote__cash_receipts",
                queryset=receipt_queryset,
                to_attr="_balance_sheet_receipts",
            ),
            Prefetch(
                "quote__expenses",
                queryset=expense_queryset,
                to_attr="_balance_sheet_expenses",
            ),
            Prefetch(
                "quote__bank_loans",
                queryset=bank_loan_queryset,
                to_attr="_balance_sheet_bank_loans",
            ),
        )
    )


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
# EXPENSE PRESETS
# =========================================================


class ExpensePresetListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = ExpensePresetSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsMaster()]

        return [IsAuthenticated()]
    """
    List and create Master expense presets.
    """

    

    def get_queryset(self):
        queryset = selectors.list_expense_presets()

        active_only = self.request.query_params.get(
            "active_only"
        )

        if active_only == "true":
            queryset = queryset.filter(
                is_active=True
            )

        expense_type = self.request.query_params.get(
            "expense_type"
        )

        if expense_type:
            queryset = queryset.filter(
                expense_type=expense_type
            )

        return queryset


class ExpensePresetDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    permission_classes = [
        IsMaster,
    ]
    """
    Retrieve, update, or delete an expense preset.
    """

    queryset = ExpensePreset.objects.all()
    serializer_class = ExpensePresetSerializer

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

        if (
            getattr(request.user, "role", None) != "MASTER"
            and serializer.validated_data.get("manual_interest_rate") is not None
        ):
            return Response(
                {
                    "success": False,
                    "message": "Only Master users can use a custom interest rate.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            calculation_data = serializer.validated_data.copy()

            result = services.calculate_emi(
                **calculation_data
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        exc.messages[0]
                        if exc.messages
                        else str(exc)
                    ),
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

        if getattr(request.user, "role", None) == "SALES_STAFF":
            queryset = queryset.filter(
                created_by=request.user
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

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)

        serializer = EmiSheetSerializer(
            page,
            many=True,
        )

        response = paginator.get_paginated_response(serializer.data)
        response.status_code = status.HTTP_200_OK
        return response

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

        if (
            getattr(request.user, "role", None) != "MASTER"
            and serializer.validated_data.get("manual_interest_rate") is not None
        ):
            return Response(
                {
                    "success": False,
                    "message": "Only Master users can use a custom interest rate.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
           emi_sheet = services.create_emi_sheet(
            created_by=request.user,
            **serializer.validated_data,
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

        if (
            getattr(request.user, "role", None) == "SALES_STAFF"
            and emi_sheet.created_by_id != request.user.id
        ):
            return Response(
                {
                    "success": False,
                    "message": "You do not have access to this EMI sheet.",
                },
                status=status.HTTP_403_FORBIDDEN,
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

    def patch(self, request, pk):
        """
        Update editable EMI sheet information.
        Financial snapshot fields remain immutable.
        """

        emi_sheet = get_object_or_404(
            EmiSheet,
            pk=pk,
        )

        if (
            getattr(request.user, "role", None) == "SALES_STAFF"
            and emi_sheet.created_by_id != request.user.id
        ):
            return Response(
                {
                    "success": False,
                    "message": "You do not have access to this EMI sheet.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = EmiSheetUpdateSerializer(
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            emi_sheet = services.update_emi_sheet(
                emi_sheet=emi_sheet,
                **serializer.validated_data,
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
                "message": "EMI sheet updated successfully.",
                "data": response_serializer.data,
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

# =========================================================
# INSURANCE BANDS
# =========================================================


class InsuranceBandListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = InsuranceBandSerializer
    
    permission_classes = [
        IsAuthenticated,
    ]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsMaster()]

        return [IsAuthenticated()]
    """
    List and create Master insurance bands.
    """

    

    def get_queryset(self):
        queryset = selectors.list_insurance_bands()

        active_only = self.request.query_params.get(
            "active_only"
        )

        if active_only == "true":
            queryset = queryset.filter(
                is_active=True
            )

        return queryset


class InsuranceBandDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    permission_classes = [
        IsMaster,
    ]

    queryset = InsuranceBand.objects.all()
    serializer_class = InsuranceBandSerializer
    """
    Retrieve, update, or delete an insurance band.
    """


# =========================================================
# SERVICE PACKAGES
# =========================================================


class ServicePackageListCreateView(
    generics.ListCreateAPIView
):
    """
    List and create Master service packages.
    """

    serializer_class = ServicePackageSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsMaster()]

        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = selectors.list_service_packages()

        active_only = self.request.query_params.get(
            "active_only"
        )

        if active_only == "true":
            queryset = queryset.filter(
                is_active=True
            )

        return queryset


class ServicePackageDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    permission_classes = [
        IsMaster,
    ]
    """
    Retrieve, update, or delete a service package.
    """

    queryset = ServicePackage.objects.all()
    serializer_class = ServicePackageSerializer


# =========================================================
# BANK PROCESSING CONFIGURATION
# =========================================================


class BankProcessingConfigurationListCreateView(
    generics.ListCreateAPIView
):
    """
    List and create bank processing configurations.
    """

    serializer_class = (
        BankProcessingConfigurationSerializer
    )

    permission_classes = [
        IsAuthenticated,
    ]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsMaster()]

        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = (
            selectors
            .list_bank_processing_configurations()
        )

        active_only = self.request.query_params.get(
            "active_only"
        )

        if active_only == "true":
            queryset = queryset.filter(
                is_active=True
            )

        return queryset


class BankProcessingConfigurationDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    permission_classes = [
        IsMaster,
    ]

    """
    Retrieve, update, or delete a bank processing
    configuration.
    """

    queryset = (
        BankProcessingConfiguration.objects
        .select_related("bank")
    )

    serializer_class = (
        BankProcessingConfigurationSerializer
    )
    
class BankLoanCreateView(APIView):
    permission_classes = [IsMaster]
    def post(self, request):
        serializer = BankLoanCreateSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        quote_id = serializer.validated_data["quote_id"]

        quote = get_object_or_404(
            Quote,
            id=quote_id,
        )

        try:
            bank_loan = create_bank_loan_from_quote(
                quote=quote,
                bank_id=serializer.validated_data.get(
                    "bank_id"
                ),
                agent=request.user,
                priority=serializer.validated_data.get(
                    "priority",
                    BankLoan.Priority.MEDIUM,
                ),
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "detail": exc.detail
                    if hasattr(exc, "detail")
                    else str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            BankLoanSerializer(bank_loan).data,
            status=status.HTTP_201_CREATED,
        )
        
    def get(self, request):
        queryset = (
            BankLoan.objects
            .select_related(
                "customer",
                "car",
                "agent",
                "bank",
                "quote",
                "emi_sheet",
            )
            .order_by("-created_at")
        )

        # -------------------------------------------------
        # Server-side search
        # -------------------------------------------------

        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search)
                | Q(customer_mobile__icontains=search)
                | Q(vehicle_stock_id__icontains=search)
                | Q(vehicle_make__icontains=search)
                | Q(vehicle_model__icontains=search)
                | Q(vehicle_variant__icontains=search)
                | Q(vehicle_chassis_number__icontains=search)
                | Q(vehicle_engine_number__icontains=search)
                | Q(quote__quote_number__icontains=search)
                | Q(bank_name__icontains=search)
            )

        # -------------------------------------------------
        # Decision status
        # -------------------------------------------------

        status_filter = request.query_params.get("status")

        if status_filter:
            queryset = queryset.filter(
                status=status_filter
            )

        # -------------------------------------------------
        # Bank
        # -------------------------------------------------

        bank_filter = request.query_params.get("bank")

        if bank_filter:
            queryset = queryset.filter(
                bank_id=bank_filter
            )

        # -------------------------------------------------
        # Priority
        # -------------------------------------------------

        priority_filter = request.query_params.get(
            "priority"
        )

        if priority_filter:
            queryset = queryset.filter(
                priority=priority_filter
            )

        # -------------------------------------------------
        # Application status
        # -------------------------------------------------

        application_status_filter = (
            request.query_params.get(
                "application_status"
            )
        )

        if application_status_filter:
            queryset = queryset.filter(
                application_status=
                    application_status_filter
            )

        serializer = BankLoanSerializer(
            queryset,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
        
class BankLoanStatusUpdateView(APIView):
    permission_classes = [IsMaster]
    def patch(self, request, pk):
        bank_loan = get_object_or_404(
            BankLoan,
            pk=pk,
        )

        serializer = BankLoanStatusUpdateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            bank_loan = update_bank_loan_status(
                bank_loan=bank_loan,
                new_status=serializer.validated_data[
                    "status"
                ],
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "detail": exc.detail
                    if hasattr(exc, "detail")
                    else str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            BankLoanSerializer(bank_loan).data
        )
        
class BankLoanFinanceUpdateView(APIView):
    permission_classes = [IsMaster]
    def patch(self, request, pk):
        bank_loan = get_object_or_404(
            BankLoan,
            pk=pk,
        )

        serializer = BankLoanFinanceUpdateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            bank_loan = update_bank_loan_finance(
                bank_loan=bank_loan,
                requested_finance=serializer.validated_data.get(
                    "requested_finance"
                ),
                approved_finance=serializer.validated_data.get(
                    "approved_finance"
                ),
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "detail": exc.detail
                    if hasattr(exc, "detail")
                    else str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            BankLoanSerializer(bank_loan).data
        )
        
class BankLoanPriorityUpdateView(APIView):
    permission_classes = [IsMaster]
    def patch(self, request, pk):
        bank_loan = get_object_or_404(
            BankLoan,
            pk=pk,
        )

        serializer = BankLoanPriorityUpdateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            bank_loan = update_bank_loan_priority(
                bank_loan=bank_loan,
                priority=serializer.validated_data[
                    "priority"
                ],
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "detail": exc.detail
                    if hasattr(exc, "detail")
                    else str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            BankLoanSerializer(bank_loan).data
        )
        
        
class BankLoanFollowUpCreateView(APIView):
    permission_classes = [IsMaster]
    def get(self, request, pk):
        bank_loan = get_object_or_404(
            BankLoan,
            pk=pk,
        )

        follow_ups = (
            BankLoanFollowUp.objects
            .filter(
                bank_loan=bank_loan,
            )
            .select_related(
                "created_by",
            )
            .order_by(
                "-created_at",
            )
        )

        serializer = BankLoanFollowUpSerializer(
            follow_ups,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request, pk):
        bank_loan = get_object_or_404(
            BankLoan,
            pk=pk,
        )

        serializer = BankLoanFollowUpCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            follow_up = create_bank_loan_follow_up(
                bank_loan=bank_loan,
                note=serializer.validated_data["note"],
                follow_up_date=serializer.validated_data.get(
                    "follow_up_date"
                ),
                created_by=request.user,
            )
        except DjangoValidationError as exc:
            return Response(
                {
                    "detail": (
                        exc.detail
                        if hasattr(exc, "detail")
                        else str(exc)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            BankLoanFollowUpSerializer(
                follow_up,
            ).data,
            status=status.HTTP_201_CREATED,
        )
        
class BankLoanNewBankView(APIView):
    permission_classes = [IsMaster]
    def post(self, request, pk):
        bank_loan = get_object_or_404(
            BankLoan,
            pk=pk,
        )

        serializer = BankLoanCreateSerializer(
            data={
                "quote_id": str(
                    bank_loan.quote_id
                ),
                "bank_id": request.data.get(
                    "bank_id"
                ),
                "priority": request.data.get(
                    "priority",
                    bank_loan.priority,
                ),
            }
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            new_bank_loan = (
                create_bank_loan_with_new_bank(
                    bank_loan=bank_loan,
                    bank_id=serializer.validated_data[
                        "bank_id"
                    ],
                    agent=request.user,
                    priority=serializer.validated_data.get(
                        "priority",
                        bank_loan.priority,
                    ),
                )
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "detail": exc.detail
                    if hasattr(exc, "detail")
                    else str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            BankLoanSerializer(
                new_bank_loan
            ).data,
            status=status.HTTP_201_CREATED,
        )
        
class BankLoanApplicationStatusUpdateView(APIView):
    permission_classes = [IsMaster]
    def patch(self, request, pk):
        bank_loan = get_object_or_404(
            BankLoan,
            pk=pk,
        )

        serializer = BankLoanApplicationStatusUpdateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            bank_loan = update_bank_loan_application_status(
                bank_loan=bank_loan,
                application_status=serializer.validated_data[
                    "application_status"
                ],
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "detail": (
                        exc.detail
                        if hasattr(exc, "detail")
                        else str(exc)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            BankLoanSerializer(bank_loan).data,
            status=status.HTTP_200_OK,
        )
        
class BankLoanApplicationInfoUpdateView(APIView):
    permission_classes = [IsMaster]
    def patch(self, request, pk):
        bank_loan = get_object_or_404(
            BankLoan,
            pk=pk,
        )

        serializer = BankLoanApplicationInfoUpdateSerializer(
            bank_loan,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        bank_loan = serializer.save()

        return Response(
            BankLoanSerializer(bank_loan).data,
            status=status.HTTP_200_OK,
        )
class BankLoanListView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        queryset = (
            BankLoan.objects
            .select_related(
                "customer",
                "car",
                "agent",
                "bank",
                "quote",
                "emi_sheet",
            )
            .order_by("-created_at")
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)

        serializer = BankLoanSerializer(
            page,
            many=True,
        )

        response = paginator.get_paginated_response(serializer.data)
        response.status_code = status.HTTP_200_OK
        return response
        
class BankLoanDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request, pk):
        bank_loan = get_object_or_404(
            BankLoan.objects.select_related(
                "customer",
                "car",
                "agent",
                "bank",
                "quote",
                "emi_sheet",
            ),
            pk=pk,
        )

        serializer = BankLoanSerializer(
            bank_loan,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
        
        
# =========================================================
# CASH DEAL LIST / CREATE
# =========================================================

class CashDealListCreateView(APIView):
    permission_classes = [IsMaster]

    def get(self, request):
        queryset = (
            CashDeal.objects
            .select_related(
                "customer",
                "car",
                "agent",
                "quote",
            )
            .order_by("-created_at")
        )

        # -------------------------------------------------
        # Server-side search
        # -------------------------------------------------

        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search)
                | Q(customer_mobile__icontains=search)
                | Q(vehicle_stock_id__icontains=search)
                | Q(vehicle_make__icontains=search)
                | Q(vehicle_model__icontains=search)
                | Q(vehicle_variant__icontains=search)
                | Q(vehicle_chassis_number__icontains=search)
                | Q(vehicle_engine_number__icontains=search)
                | Q(quote__quote_number__icontains=search)
                | Q(agent__first_name__icontains=search)
                | Q(agent__last_name__icontains=search)
                | Q(agent__email__icontains=search)
            )

        # -------------------------------------------------
        # Status filter
        # -------------------------------------------------

        status_filter = request.query_params.get("status")

        if status_filter:
            queryset = queryset.filter(
                status=status_filter
            )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)

        serializer = CashDealSerializer(
            page,
            many=True,
        )

        response = paginator.get_paginated_response(serializer.data)
        response.status_code = status.HTTP_200_OK
        return response

    def post(self, request):
        serializer = CashDealCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        quote = get_object_or_404(
            Quote,
            pk=serializer.validated_data["quote_id"],
        )

        try:
            cash_deal = create_cash_deal(
                quote=quote,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "detail": (
                        exc.detail
                        if hasattr(exc, "detail")
                        else str(exc)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            CashDealSerializer(cash_deal).data,
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# CASH DEAL DETAIL / UPDATE
# =========================================================

class CashDealDetailView(APIView):
    permission_classes = [IsMaster]

    def get(self, request, pk):
        cash_deal = get_object_or_404(
            CashDeal.objects.select_related(
                "customer",
                "car",
                "agent",
                "quote",
            ),
            pk=pk,
        )

        return Response(
            {
                "success": True,
                "data": CashDealSerializer(
                    cash_deal,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        cash_deal = get_object_or_404(
            CashDeal.objects.select_related(
                "customer",
                "car",
                "agent",
                "quote",
            ),
            pk=pk,
        )

        serializer = CashDealUpdateSerializer(
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        validated_data = serializer.validated_data

        try:
            if "advance_amount" in validated_data:
                cash_deal = update_cash_deal_financials(
                    cash_deal=cash_deal,
                    advance_amount=validated_data[
                        "advance_amount"
                    ],
                )

            if "remark" in validated_data:
                cash_deal.remark = validated_data["remark"]
                cash_deal.save(
                    update_fields=[
                        "remark",
                        "updated_at",
                    ]
                )

        except DjangoValidationError as exc:
            return Response(
                {
                    "detail": (
                        exc.detail
                        if hasattr(exc, "detail")
                        else str(exc)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": "Cash Deal updated successfully.",
                "data": CashDealSerializer(
                    cash_deal,
                ).data,
            },
            status=status.HTTP_200_OK,
        )
        
# =========================================================
# CASH RECEIPT HELPERS
# =========================================================

def _cash_receipt_total_received(quote_id):
    total = (
        CashReceipt.objects
        .filter(
            quote_id=quote_id,
            direction=CashReceipt.Direction.CUSTOMER_PAYMENT,
        )
        .aggregate(total= Sum("amount"))
        .get("total")
    )

    return total or 0


# =========================================================
# CASH RECEIPT CUSTOMER DEALS
# =========================================================

class CashReceiptCustomerDealsView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request, customer_id):
        customer = get_object_or_404(
            Customer,
            pk=customer_id,
        )

        quotes = (
            Quote.objects
            .filter(customer_id=customer.id)
            .select_related("car")
            .order_by("-created_at")
        )

        data = []

        for quote in quotes:
            data.append(
                {
                    "id": quote.id,
                    "quote_number": quote.quote_number,
                    "payment_method": quote.payment_method,
                    "status": quote.status,
                    "car_id": str(quote.car_id)
                    if quote.car_id
                    else None,
                    "vehicle_stock_id": (
                        quote.car.stock_id
                        if quote.car
                        else None
                    ),
                    "vehicle_make": (
                        quote.car.make
                        if quote.car
                        else None
                    ),
                    "vehicle_model": (
                        quote.car.model
                        if quote.car
                        else None
                    ),
                    "vehicle_chassis_number": (
                        quote.car.chassis_number
                        if quote.car
                        else None
                    ),
                    "customer_name": quote.customer_name,
                    "customer_mobile": quote.customer_mobile,
                }
            )

        return Response(
            {
                "success": True,
                "data": data,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# CASH RECEIPT LIST / CREATE
# =========================================================

class CashReceiptListCreateView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request):
        queryset = (
            CashReceipt.objects
            .select_related(
                "customer",
                "quote",
                "car",
                "created_by",
            )
            .order_by(
                "-transaction_date",
                "-created_at",
            )
        )

        customer_id = request.query_params.get(
            "customer_id"
        )
        quote_id = request.query_params.get(
            "quote_id"
        )
        direction = request.query_params.get(
            "direction"
        )
        category = request.query_params.get(
            "category"
        )
        payment_method = request.query_params.get(
            "payment_method"
        )
        receipt_number = request.GET.get("receipt_number")
        search = request.GET.get("search")
        date_from = request.GET.get("date_from")
        date_to = request.GET.get("date_to")
        transaction_date = request.GET.get("transaction_date")

        if receipt_number:
            queryset = queryset.filter(
                receipt_number__icontains=receipt_number
            )

        if search:
            queryset = queryset.filter(
                Q(receipt_number__icontains=search)
                | Q(quote__quote_number__icontains=search)
                | Q(quote__customer_name__icontains=search)
                | Q(quote__customer_mobile__icontains=search)
                | Q(car__stock_id__icontains=search)
                | Q(car__chassis_number__icontains=search)
                | Q(car__make__icontains=search)
                | Q(car__model__icontains=search)
                | Q(car__variant__icontains=search)
            ).distinct()

        if transaction_date:
            try:
                parsed_date = datetime.strptime(
                    transaction_date,
                    "%Y-%m-%d",
                ).date()
            except ValueError:
                return Response(
                    {
                        "success": False,
                        "message": "Invalid transaction_date. Use YYYY-MM-DD.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            queryset = queryset.filter(
                transaction_date=parsed_date
            )

        if date_from:
            try:
                parsed_date_from = datetime.strptime(
                    date_from,
                    "%Y-%m-%d",
                ).date()
            except ValueError:
                return Response(
                    {
                        "success": False,
                        "message": "Invalid date_from. Use YYYY-MM-DD.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            queryset = queryset.filter(
                transaction_date__gte=parsed_date_from
            )

        if date_to:
            try:
                parsed_date_to = datetime.strptime(
                    date_to,
                    "%Y-%m-%d",
                ).date()
            except ValueError:
                return Response(
                    {
                        "success": False,
                        "message": "Invalid date_to. Use YYYY-MM-DD.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            queryset = queryset.filter(
                transaction_date__lte=parsed_date_to
            )

        if customer_id:
            queryset = queryset.filter(
                customer_id=customer_id
            )

        if quote_id:
            queryset = queryset.filter(
                quote_id=quote_id
            )

        if direction:
            queryset = queryset.filter(
                direction=direction
            )

        if category:
            queryset = queryset.filter(
                category=category
            )

        if payment_method:
            queryset = queryset.filter(
                payment_method=payment_method
            )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = CashReceiptSerializer(page, many=True)

        total_received = (
            queryset
            .filter(
                direction=CashReceipt.Direction.CUSTOMER_PAYMENT,
            )
            .aggregate(
                total=Sum("amount")
            )
            .get("total")
            or 0
        )

        response = paginator.get_paginated_response(serializer.data)
        response.data["summary"] = {
            "total_received": total_received,
        }
        response.status_code = status.HTTP_200_OK
        return response

    def post(self, request):
        serializer = CashReceiptCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        customer = get_object_or_404(
            Customer,
            pk=serializer.validated_data[
                "customer_id"
            ],
        )

        quote = get_object_or_404(
            Quote,
            pk=serializer.validated_data[
                "quote_id"
            ],
        )

        car = None

        car_id = serializer.validated_data.get(
            "car_id"
        )

        if car_id:
            from inventory.models import Car

            car = get_object_or_404(
                Car,
                pk=car_id,
            )
            
        quote_expense = None
        quote_expense_id = serializer.validated_data.get(
            "quote_expense_id"
        )

        if quote_expense_id:
            from quotes.models import QuoteExpense

            quote_expense = get_object_or_404(
                QuoteExpense,
                pk=quote_expense_id,
            )

        emi_expense = None
        emi_expense_id = serializer.validated_data.get(
            "emi_expense_id"
        )

        if emi_expense_id:
            from .models import EmiExpense

            emi_expense = get_object_or_404(
                EmiExpense,
                pk=emi_expense_id,
            )

        try:
            receipt = services.create_cash_receipt(
                customer=customer,
                quote=quote,
                car=car,
                quote_expense=quote_expense,
                emi_expense=emi_expense,
                direction=serializer.validated_data[
                    "direction"
                ],
                category=serializer.validated_data[
                    "category"
                ],
                amount=serializer.validated_data[
                    "amount"
                ],
                payment_method=serializer.validated_data[
                    "payment_method"
                ],
                description=serializer.validated_data.get(
                    "description",
                    "",
                ),
                reference=serializer.validated_data.get(
                    "reference",
                    "",
                ),
                transaction_date=serializer.validated_data.get(
                    "transaction_date"
                ),
                created_by=request.user,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "detail": (
                        exc.detail
                        if hasattr(exc, "detail")
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "data": CashReceiptSerializer(
                    receipt
                ).data,
                "summary": {
                    "total_received": (
                        _cash_receipt_total_received(
                            receipt.quote_id
                        )
                    ),
                },
            },
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# CASH RECEIPT DETAIL / UPDATE
# =========================================================

class CashReceiptDetailView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request, pk):
        receipt = get_object_or_404(
            CashReceipt.objects.select_related(
                "customer",
                "quote",
                "car",
                "created_by",
            ),
            pk=pk,
        )

        return Response(
            {
                "success": True,
                "data": CashReceiptSerializer(
                    receipt
                ).data,
                "summary": {
                    "total_received": (
                        _cash_receipt_total_received(
                            receipt.quote_id
                        )
                    ),
                },
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        receipt = get_object_or_404(
            CashReceipt,
            pk=pk,
        )

        serializer = CashReceiptUpdateSerializer(
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        receipt.description = (
            serializer.validated_data.get(
                "description",
                receipt.description,
            )
        )

        receipt.reference = (
            serializer.validated_data.get(
                "reference",
                receipt.reference,
            )
        )

        receipt.save(
            update_fields=[
                "description",
                "reference",
                "updated_at",
            ]
        )

        receipt.refresh_from_db()

        return Response(
            {
                "success": True,
                "data": CashReceiptSerializer(
                    receipt
                ).data,
            },
            status=status.HTTP_200_OK,
        )

class CashReceiptCategoryListView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request):
        from .services import STANDARD_CASH_RECEIPT_CATEGORIES

        standard_categories = [
            {
                "value": value,
                "label": value.replace("_", " ").title(),
                "source": "standard",
            }
            for value in sorted(
                STANDARD_CASH_RECEIPT_CATEGORIES
            )
        ]

        presets = (
            ExpensePreset.objects
            .filter(is_active=True)
            .order_by("expense_type", "name")
        )

        dynamic_categories = []

        seen = set(
            item["value"]
            for item in standard_categories
        )

        for preset in presets:
            value = preset.expense_type.strip().lower()

            if not value or value in seen:
                continue

            dynamic_categories.append(
                {
                    "value": value,
                    "label": preset.name,
                    "source": "finance_master",
                    "expense_preset_id": preset.id,
                    "expense_type": preset.expense_type,
                }
            )

            seen.add(value)

        return Response(
            {
                "success": True,
                "data": (
                    standard_categories
                    + dynamic_categories
                ),
            },
            status=status.HTTP_200_OK,
        )


class CashReceiptReverseView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def post(self, request, pk):
        receipt = get_object_or_404(
            CashReceipt.objects.select_related(
                "customer",
                "quote",
                "car",
                "created_by",
            ),
            pk=pk,
        )

        description = request.data.get(
            "description",
            "",
        )

        reference = request.data.get(
            "reference",
            "",
        )

        try:
            reversal = reverse_cash_receipt(
                receipt=receipt,
                created_by=request.user,
                description=description,
                reference=reference,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "detail": (
                        exc.message
                        if hasattr(exc, "message")
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": (
                    "Cash Receipt reversed successfully."
                ),
                "data": CashReceiptSerializer(
                    reversal,
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )     
        
# =========================================================
# BALANCE SHEET CUSTOMER DEALS
# =========================================================

class BalanceSheetCustomerDealsView(APIView):
    permission_classes = [IsMasterOrAdmin]
    
    def get(self, request, customer_id):
        customer = get_object_or_404(
            Customer,
            pk=customer_id,
        )

        quotes = (
            Quote.objects
            .filter(customer_id=customer.id)
            .select_related("car")
            .order_by("-created_at")
        )

        data = []

        for quote in quotes:
            data.append(
                {
                    "id": quote.id,
                    "quote_number": quote.quote_number,
                    "payment_method": quote.payment_method,
                    "status": quote.status,
                    "car_id": (
                        str(quote.car_id)
                        if quote.car_id
                        else None
                    ),
                    "vehicle_stock_id": (
                        quote.car.stock_id
                        if quote.car
                        else None
                    ),
                    "vehicle_make": (
                        quote.car.make
                        if quote.car
                        else None
                    ),
                    "vehicle_model": (
                        quote.car.model
                        if quote.car
                        else None
                    ),
                    "vehicle_variant": (
                        quote.car.variant
                        if quote.car
                        else None
                    ),
                    "vehicle_year": (
                        quote.car.year
                        if quote.car
                        else None
                    ),
                    "vehicle_colour": (
                        quote.car.colour
                        if quote.car
                        else None
                    ),
                    "vehicle_chassis_number": (
                        quote.car.chassis_number
                        if quote.car
                        else None
                    ),
                    "customer_name": quote.customer_name,
                    "customer_mobile": quote.customer_mobile,
                }
            )

        return Response(
            {
                "success": True,
                "data": data,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# BALANCE SHEET LIST / CREATE
# =========================================================

class BalanceSheetListCreateView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request):
        queryset = _balance_sheet_queryset().order_by(
            "-created_at",
        )

        customer_id = request.query_params.get(
            "customer_id"
        )

        quote_id = request.query_params.get(
            "quote_id"
        )

        search = request.query_params.get(
            "search"
        )

        payment_method = request.query_params.get(
            "payment_method"
        )

        balance_status = request.query_params.get(
            "balance_status"
        )

        if customer_id:
            queryset = queryset.filter(
                customer_id=customer_id
            )

        if quote_id:
            queryset = queryset.filter(
                quote_id=quote_id
            )
            
        if payment_method:
            queryset = queryset.filter(
                quote__payment_method=payment_method
            )
            
         # -------------------------------------------------
        # Search
        #
        # Search customer, quote, vehicle, and chassis.
        # Use Quote customer snapshot fields so this also
        # works with the existing project structure.
        # -------------------------------------------------
        if search:
            queryset = queryset.filter(
                Q(
                    quote__quote_number__icontains=search
                )
                | Q(
                    quote__customer_name__icontains=search
                )
                | Q(
                    quote__customer_mobile__icontains=search
                )
                | Q(
                    car__stock_id__icontains=search
                )
                | Q(
                    car__chassis_number__icontains=search
                )
                | Q(
                    car__make__icontains=search
                )
                | Q(
                    car__model__icontains=search
                )
                | Q(
                    car__variant__icontains=search
                )
            ).distinct()

        # -------------------------------------------------
        # Calculated balance-status filter
        #
        # Do NOT add a database balance_status column.
        # Calculate it from CashReceipt movements.
        # -------------------------------------------------
        if balance_status:
            receipt_totals = (
                CashReceipt.objects
                .filter(
                    quote_id=OuterRef("quote_id"),
                )
                .order_by()
                .values("quote_id")
                .annotate(
                    total_received=Sum(
                        "amount",
                        filter=Q(
                            direction=(
                                CashReceipt.Direction.CUSTOMER_PAYMENT
                            )
                        ),
                    ),
                    total_spent=Sum(
                        "amount",
                        filter=Q(
                            direction=(
                                CashReceipt.Direction.COMPANY_ON_BEHALF
                            )
                        ),
                    ),
                )
            )
            zero_amount = Value(
                Decimal("0.00"),
                output_field=DecimalField(
                    max_digits=12,
                    decimal_places=2,
                ),
            )
            queryset = queryset.annotate(
                _balance_received=Coalesce(
                    Subquery(
                        receipt_totals.values("total_received")[:1],
                    ),
                    zero_amount,
                ),
                _balance_spent=Coalesce(
                    Subquery(
                        receipt_totals.values("total_spent")[:1],
                    ),
                    zero_amount,
                ),
            )

            if balance_status == "settled":
                queryset = queryset.filter(
                    _balance_received=F("_balance_spent"),
                )
            elif balance_status == "customer_receivable":
                queryset = queryset.filter(
                    _balance_received__gt=F("_balance_spent"),
                )
            elif balance_status == "customer_payable":
                queryset = queryset.filter(
                    _balance_received__lt=F("_balance_spent"),
                )
            else:
                queryset = queryset.none()

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = BalanceSheetListSerializer(page, many=True)

        response = paginator.get_paginated_response(serializer.data)
        response.status_code = status.HTTP_200_OK
        return response

    def post(self, request):
        serializer = BalanceSheetCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        customer = get_object_or_404(
            Customer,
            pk=serializer.validated_data[
                "customer_id"
            ],
        )

        quote = get_object_or_404(
            Quote,
            pk=serializer.validated_data[
                "quote_id"
            ],
        )

        try:
            balance_sheet = services.create_balance_sheet(
                customer=customer,
                quote=quote,
                created_by=request.user,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "detail": (
                        exc.detail
                        if hasattr(exc, "detail")
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        balance_sheet = (
            BalanceSheet.objects
            .select_related(
                "customer",
                "quote",
                "car",
                "created_by",
            )
            .get(pk=balance_sheet.pk)
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Balance Sheet created successfully."
                ),
                "data": BalanceSheetSerializer(
                    balance_sheet
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# BALANCE SHEET DETAIL
# =========================================================

class BalanceSheetDetailView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request, pk):
        balance_sheet = get_object_or_404(
            _balance_sheet_queryset(),
            pk=pk,
        )

        return Response(
            {
                "success": True,
                "data": BalanceSheetSerializer(
                    balance_sheet
                ).data,
            },
            status=status.HTTP_200_OK,
        )
        
    def delete(self, request, pk):
        """
        Delete a Balance Sheet.
        Master users only.

        This removes only the BalanceSheet record.
        CashReceipt financial transactions are not deleted.
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
                        "to delete a Balance Sheet."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        balance_sheet = get_object_or_404(
            BalanceSheet,
            pk=pk,
        )

        balance_sheet.delete()

        return Response(
            {
                "success": True,
                "message": (
                    "Balance Sheet deleted successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )
        
    def patch(self, request, pk):
        """
        Update Balance Sheet configuration.

        Master users only.
        Financial movement fields remain backend-calculated.
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
                        "to edit the Balance Sheet."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        balance_sheet = get_object_or_404(
            BalanceSheet,
            pk=pk,
        )

        serializer = BalanceSheetMasterUpdateSerializer(
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            balance_sheet = (
                services.update_balance_sheet_as_master(
                    balance_sheet=balance_sheet,
                    **serializer.validated_data,
                )
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        exc.detail
                        if hasattr(exc, "detail")
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        balance_sheet = (
            BalanceSheet.objects
            .select_related(
                "customer",
                "quote",
                "car",
                "created_by",
            )
            .get(pk=balance_sheet.pk)
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Balance Sheet updated successfully."
                ),
                "data": BalanceSheetSerializer(
                    balance_sheet
                ).data,
            },
            status=status.HTTP_200_OK,
        )