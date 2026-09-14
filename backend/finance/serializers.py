from decimal import Decimal

from rest_framework import serializers

from inventory.models import Car
from django.db.models import Sum
from .models import (
    Bank,
    BankProcessingConfiguration,
    EmiExpense,
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


# =========================================================
# BANK
# =========================================================


class BankSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bank
        fields = [
            "id",
            "name",
            "interest_rate",
            "is_cash",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Bank name is required."
            )

        return value

    def validate_interest_rate(self, value):
        if value < Decimal("0"):
            raise serializers.ValidationError(
                "Interest rate cannot be negative."
            )

        return value

    def validate(self, attrs):
        is_cash = attrs.get(
            "is_cash",
            getattr(
                self.instance,
                "is_cash",
                False,
            ),
        )

        interest_rate = attrs.get(
            "interest_rate",
            getattr(
                self.instance,
                "interest_rate",
                Decimal("0.00"),
            ),
        )

        if is_cash and interest_rate != Decimal(
            "0.00"
        ):
            raise serializers.ValidationError(
                {
                    "interest_rate": (
                        "Cash banks must have "
                        "0% interest."
                    )
                }
            )

        return attrs


# =========================================================
# EXPENSE PRESET
# =========================================================

class ExpensePresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpensePreset
        fields = [
            "id",
            "name",
            "expense_type",
            "calculation_type",
            "amount",
            "percentage",
            "minimum_amount",
            "condition_key",
            "condition_value",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Expense preset name is required."
            )

        return value

    def validate_amount(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError(
                "Amount cannot be negative."
            )

        return value


# =========================================================
# INSURANCE BAND
# =========================================================

class InsuranceBandSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuranceBand
        fields = [
            "id",
            "name",
            "minimum_vehicle_price",
            "maximum_vehicle_price",
            "amount",
            "no_license_surcharge",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        minimum = attrs.get(
            "minimum_vehicle_price",
            getattr(
                self.instance,
                "minimum_vehicle_price",
                None,
            ),
        )

        maximum = attrs.get(
            "maximum_vehicle_price",
            getattr(
                self.instance,
                "maximum_vehicle_price",
                None,
            ),
        )

        is_active = attrs.get(
            "is_active",
            getattr(
                self.instance,
                "is_active",
                True,
            ),
        )

        # -------------------------------------------------
        # Range validation
        # -------------------------------------------------

        if (
            minimum is not None
            and maximum is not None
            and maximum <= minimum
        ):
            raise serializers.ValidationError(
                {
                    "maximum_vehicle_price": (
                        "Maximum vehicle price must be "
                        "greater than minimum vehicle price."
                    )
                }
            )

        # -------------------------------------------------
        # Active insurance band overlap validation
        # -------------------------------------------------

        if (
            is_active
            and minimum is not None
            and maximum is not None
        ):
            queryset = InsuranceBand.objects.filter(
                is_active=True,
                minimum_vehicle_price__lte=maximum,
                maximum_vehicle_price__gte=minimum,
            )

            # Exclude the current record during PATCH.
            if self.instance is not None:
                queryset = queryset.exclude(
                    pk=self.instance.pk,
                )

            if queryset.exists():
                conflicting_band = queryset.order_by(
                    "minimum_vehicle_price",
                ).first()

                raise serializers.ValidationError(
                    {
                        "minimum_vehicle_price": (
                            "This insurance band overlaps "
                            f"with the active band "
                            f"'{conflicting_band.name}'."
                        ),
                        "maximum_vehicle_price": (
                            "Active insurance bands cannot overlap."
                        ),
                    }
                )

        return attrs

    def validate_amount(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError(
                "Insurance amount cannot be negative."
            )

        return value

    def validate_no_license_surcharge(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError(
                "No driving licence surcharge cannot be negative."
            )

        return value


# =========================================================
# SERVICE PACKAGE
# =========================================================

class ServicePackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicePackage
        fields = [
            "id",
            "name",
            "description",
            "amount",
            "is_default",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Service package name is required."
            )

        return value

    def validate_description(self, value):
        return value.strip()

    def validate_amount(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError(
                "Service package amount cannot be negative."
            )

        return value

    def validate(self, attrs):
        is_default = attrs.get(
            "is_default",
            getattr(
                self.instance,
                "is_default",
                False,
            ),
        )

        is_active = attrs.get(
            "is_active",
            getattr(
                self.instance,
                "is_active",
                True,
            ),
        )

        # A default package must be active.
        if is_default and not is_active:
            raise serializers.ValidationError(
                {
                    "is_default": (
                        "A default service package must be active."
                    )
                }
            )

        return attrs

# =========================================================
# BANK PROCESSING CONFIGURATION
# =========================================================

class BankProcessingConfigurationSerializer(
    serializers.ModelSerializer
):
    bank_name = serializers.CharField(
        source="bank.name",
        read_only=True,
    )

    class Meta:
        model = BankProcessingConfiguration

        fields = [
            "id",
            "bank",
            "bank_name",
            "percentage",
            "minimum_amount",
            "application_charge",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "bank_name",
            "created_at",
            "updated_at",
        ]

    def validate_percentage(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError(
                "Bank processing percentage cannot be negative."
            )

        return value

    def validate_minimum_amount(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError(
                "Bank processing minimum amount cannot be negative."
            )

        return value

# =========================================================
# EMI EXPENSE
# =========================================================


class EmiExpenseSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = EmiExpense
        fields = [
            "id",
            "expense_type",
            "name",
            "description",
            "amount",
            "created_at",
            "updated_at",
            
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_amount(self, value):
        if value < Decimal("0"):
            raise serializers.ValidationError(
                "Expense amount cannot be negative."
            )

        return value

    def validate_description(self, value):
        return value.strip()

# =========================================================
# EMI EXPENSE INPUT
# =========================================================


class EmiExpenseInputSerializer(serializers.Serializer):
    expense_type = serializers.CharField(
        max_length=80,
    )

    description = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )

    def validate_expense_type(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Expense type is required."
            )

        return value
# =========================================================
# EMI CALCULATION REQUEST
# =========================================================

class EmiCalculationSerializer(
    serializers.Serializer
):
    vehicle_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )

    down_payment = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )

    tenure_years = serializers.IntegerField(
        min_value=1,
        max_value=5,
    )

    bank_id = serializers.IntegerField()

    vat_enabled = serializers.BooleanField(
        required=False,
        default=False,
    )

    manual_interest_rate = (
        serializers.DecimalField(
            max_digits=5,
            decimal_places=2,
            min_value=Decimal("0.00"),
            required=False,
            allow_null=True,
        )
    )
    include_other_expenses = serializers.BooleanField(
        required=False,
        default=True,
    )

    registration_dubai = serializers.BooleanField(
        required=False,
        default=False,
    )

    driving_license = serializers.BooleanField(
        required=False,
        default=True,
    )

    service_package_selected = serializers.BooleanField(
        required=False,
        default=False,
    )

    expenses = EmiExpenseInputSerializer(
            many=True,
            required=False,
            default=list,
    )

    def validate(self, attrs):
        vehicle_price = attrs["vehicle_price"]
        down_payment = attrs["down_payment"]
        vat_enabled = attrs.get("vat_enabled", False)

        applicable_price = vehicle_price

        if vehicle_price < Decimal("20000.00"):
            raise serializers.ValidationError(
                {
                    "vehicle_price": (
                        "Vehicle price must be at least AED 20,000."
                    )
                }
            )
        if vat_enabled:
            applicable_price = (
                vehicle_price * Decimal("1.05")
            )

        if down_payment > applicable_price:
            raise serializers.ValidationError(
                {
                    "down_payment": (
                        "Down payment cannot exceed "
                        "applicable vehicle price."
                    )
                }
            )
        expenses = attrs.get("expenses", [])

        expense_types = [
            expense["expense_type"]
            for expense in expenses
        ]

        if len(expense_types) != len(set(expense_types)):
            raise serializers.ValidationError(
                {
                    "expenses": (
                        "Duplicate expense types are not allowed."
                    )
                }
            )

        return attrs





# =========================================================
# EMI SHEET CREATE REQUEST
# =========================================================
class ManualVehicleSerializer(
    serializers.Serializer
):
    make = serializers.CharField(
        max_length=100,
    )

    model = serializers.CharField(
        max_length=100,
    )

    variant = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        default="",
    )

    year = serializers.IntegerField(
        min_value=1,
    )

    colour = serializers.CharField(
        max_length=50,
    )

    mileage = serializers.IntegerField(
        min_value=0,
    )

    chassis_number = serializers.CharField(
        max_length=100,
    )

    engine_number = serializers.CharField(
        max_length=100,
    )

class EmiSheetCreateSerializer(
    serializers.Serializer
):
    customer_name = serializers.CharField(
        max_length=255,
    )

    customer_mobile = serializers.CharField(
        max_length=30,
    )

    car_id = serializers.UUIDField(
        required=False,
        allow_null=True,
    )

    manual_vehicle = ManualVehicleSerializer(
        required=False,
        allow_null=True,
    )

    vehicle_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )
    special_price_request_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    vat_enabled = serializers.BooleanField(
        required=False,
        default=False,
    )

    down_payment = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )

    tenure_years = serializers.IntegerField(
        min_value=1,
        max_value=5,
    )

    bank_id = serializers.IntegerField()

    manual_interest_rate = (
        serializers.DecimalField(
            max_digits=5,
            decimal_places=2,
            min_value=Decimal("0.00"),
            required=False,
            allow_null=True,
        )
    )

    include_other_expenses = serializers.BooleanField(
        required=False,
        default=True,
    )

    registration_dubai = serializers.BooleanField(
        required=False,
        default=False,
    )

    driving_license = serializers.BooleanField(
        required=False,
        default=True,
    )

    service_package_selected = serializers.BooleanField(
        required=False,
        default=False,
    )

    expenses = EmiExpenseInputSerializer(
        many=True,
        required=False,
        default=list,
    )

    def validate_customer_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Customer name is required."
            )

        return value

    def validate_customer_mobile(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Customer mobile is required."
            )

        return value

    def validate(self, attrs):
    # -------------------------------------------------
    # Vehicle source validation
    # -------------------------------------------------

        car_id = attrs.get("car_id")
        manual_vehicle = attrs.get("manual_vehicle")

        has_car = car_id is not None
        has_manual_vehicle = manual_vehicle is not None

        if has_car and has_manual_vehicle:
            raise serializers.ValidationError(
                {
                    "vehicle": (
                        "Provide either car_id or "
                        "manual_vehicle, not both."
                    )
                }
            )

        if not has_car and not has_manual_vehicle:
            raise serializers.ValidationError(
                {
                    "vehicle": (
                        "Either car_id or manual_vehicle "
                        "must be provided."
                    )
                }
            )

        # -------------------------------------------------
        # Financial validation
        # -------------------------------------------------

        vehicle_price = attrs["vehicle_price"]
        down_payment = attrs["down_payment"]
        vat_enabled = attrs.get("vat_enabled", False)

        applicable_price = vehicle_price

        if vehicle_price < Decimal("20000.00"):
            raise serializers.ValidationError(
                {
                    "vehicle_price": (
                        "Vehicle price must be at least AED 20,000."
                    )
                }
            )

        if vat_enabled:
            applicable_price = (
                vehicle_price * Decimal("1.05")
            )

        if down_payment > applicable_price:
            raise serializers.ValidationError(
                {
                    "down_payment": (
                        "Down payment cannot exceed "
                        "applicable vehicle price."
                    )
                }
            )
        # -------------------------------------------------
        # Inventory vehicle validation
        # -------------------------------------------------

        if car_id:
            try:
                car = Car.objects.get(
                    pk=car_id
                )
            except Car.DoesNotExist:
                raise serializers.ValidationError(
                    {
                        "car_id": (
                            "Selected vehicle "
                            "does not exist."
                        )
                    }
                )

            if not car.stock_id:
                raise serializers.ValidationError(
                    {
                        "car_id": (
                            "Selected vehicle "
                            "has no stock ID."
                        )
                    }
                )

        expenses = attrs.get("expenses", [])

        expense_types = [
            expense["expense_type"]
            for expense in expenses
        ]

        if len(expense_types) != len(set(expense_types)):
            raise serializers.ValidationError(
                {
                    "expenses": (
                        "Duplicate expense types are not allowed."
                    )
                }
            )

        return attrs


class EmiSheetUpdateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(
        max_length=255,
        required=False,
    )

    customer_mobile = serializers.CharField(
        max_length=30,
        required=False,
    )

    def validate_customer_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Customer name is required."
            )

        return value

    def validate_customer_mobile(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Customer mobile is required."
            )

        return value
# =========================================================
# EMI SHEET RESPONSE
# =========================================================


class EmiSheetSerializer(
    serializers.ModelSerializer
):
    expenses = EmiExpenseSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = EmiSheet
        fields = [
            "id",
            "emi_number",

            # Customer
            "customer",
            "customer_name",
            "customer_mobile",

            # Vehicle
            # Vehicle
            "car",
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_variant",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_mileage",
            "vehicle_chassis_number",
            "vehicle_engine_number",

            # Bank
            "bank",
            "bank_name",
            "manual_rate_used",
            "interest_rate",

            # Inputs
            "vehicle_price",
            "vat_enabled",
            "vat_amount",
            "price_after_vat",
            "down_payment",
            "finance_amount",
            "car_value_evaluation",
            "expense_total",
            "emi_principal",
            "tenure_years",

            # Results
            "total_interest",
            "total_payable",
            "monthly_emi",

            # Historical pricing/configuration snapshot
            "evaluation_name",
            "evaluation_amount",
            "bank_processing_amount",
            "insurance_band_name",
            "insurance_amount",
            "registration_amount",
            "rta_amount",
            "service_package_name",
            "service_package_amount",
            # Status
            "status",

            # Expenses
            "expenses",

            # Dates
            "created_at",
            "updated_at",

            
        ]

        read_only_fields = fields
        
        
# =========================================================
# BANK LOAN RESPONSE
# =========================================================

class BankLoanSerializer(
    serializers.ModelSerializer
):
    bank_name = serializers.CharField(
        read_only=True,
    )

    agent_name = serializers.SerializerMethodField()

    class Meta:
        model = BankLoan

        fields = [
            "id",

            # Source
            "quote",

            # Relationships
            "customer",
            "car",
            "agent",
            "agent_name",
            "bank",

            # Bank snapshot
            "bank_name",
            "interest_rate",

            # Customer snapshot
            "customer_name",
            "customer_mobile",

            # Vehicle snapshot
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_variant",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_mileage",
            "vehicle_chassis_number",
            "vehicle_engine_number",

            # Finance
            "requested_finance",
            "approved_finance",
            "selling_price",
            "evaluation",
            
            
            "application_number",
            "bank_reference",
            "relationship_manager",
            "application_date",
            "expected_approval_date",
            "remark",

            # Status
            "application_status",
            "status",
            "priority",

            # EMI
            "emi_sheet",

            # Dates
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields

    def get_agent_name(self, obj):
        if not obj.agent:
            return None

        full_name = " ".join(
            part
            for part in [
                obj.agent.first_name,
                obj.agent.last_name,
            ]
            if part
        ).strip()

        return full_name or obj.agent.email or obj.agent.username
    
# =========================================================
# BANK LOAN CREATE
# =========================================================

class BankLoanCreateSerializer(
    serializers.Serializer
):
    quote_id = serializers.IntegerField()

    bank_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    priority = serializers.ChoiceField(
        choices=BankLoan.Priority.choices,
        required=False,
        default=BankLoan.Priority.MEDIUM,
    )
    
# =========================================================
# BANK LOAN STATUS UPDATE
# =========================================================

class BankLoanStatusUpdateSerializer(
    serializers.Serializer
):
    status = serializers.ChoiceField(
        choices=BankLoan.Status.choices,
    )
    
# =========================================================
# BANK LOAN FINANCE UPDATE
# =========================================================

class BankLoanFinanceUpdateSerializer(
    serializers.Serializer
):
    requested_finance = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
        required=False,
    )

    approved_finance = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "At least one finance value is required."
            )

        return attrs
    
    
# =========================================================
# BANK LOAN PRIORITY UPDATE
# =========================================================

class BankLoanPriorityUpdateSerializer(
    serializers.Serializer
):
    priority = serializers.ChoiceField(
        choices=BankLoan.Priority.choices,
    )
    
# =========================================================
# BANK LOAN FOLLOW-UP
# =========================================================

class BankLoanFollowUpSerializer(
    serializers.ModelSerializer
):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = BankLoanFollowUp

        fields = [
            "id",
            "bank_loan",
            "note",
            "follow_up_date",
            "created_by",
            "created_by_name",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "bank_loan",
            "created_by",
            "created_by_name",
            "created_at",
        ]

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None

        full_name = " ".join(
            part
            for part in [
                getattr(obj.created_by, "first_name", ""),
                getattr(obj.created_by, "last_name", ""),
            ]
            if part
        ).strip()

        return (
            full_name
            or getattr(obj.created_by, "email", None)
            or getattr(obj.created_by, "username", None)
        )
        
# =========================================================
# BANK LOAN FOLLOW-UP CREATE
# =========================================================

class BankLoanFollowUpCreateSerializer(
    serializers.Serializer
):
    note = serializers.CharField(
        max_length=5000,
    )
    follow_up_date = serializers.DateField(
        required=False,
        allow_null=True,
    )

    def validate_note(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Follow-up note cannot be empty."
            )

        return value
    
    
class BankLoanApplicationStatusUpdateSerializer(serializers.Serializer):
    application_status = serializers.ChoiceField(
        choices=BankLoan.ApplicationStatus.choices
    )
    
class BankLoanApplicationInfoUpdateSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = BankLoan

        fields = [
            "application_number",
            "bank_reference",
            "relationship_manager",
            "application_date",
            "expected_approval_date",
            "remark",
        ]

    def validate(self, attrs):
        application_date = attrs.get(
            "application_date"
        )

        expected_approval_date = attrs.get(
            "expected_approval_date"
        )

        if (
            application_date is not None
            and expected_approval_date is not None
            and expected_approval_date < application_date
        ):
            raise serializers.ValidationError(
                {
                    "expected_approval_date":
                        "Expected approval date cannot be before application date."
                }
            )

        return attrs
    
# =========================================================
# CASH DEAL RESPONSE
# =========================================================

class CashDealSerializer(
    serializers.ModelSerializer
):
    agent_name = serializers.SerializerMethodField()

    class Meta:
        model = CashDeal

        fields = [
            "id",

            # Source
            "quote",

            # Relationships
            "customer",
            "car",
            "agent",
            "agent_name",

            # Customer snapshot
            "customer_name",
            "customer_mobile",

            # Vehicle snapshot
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_variant",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_mileage",
            "vehicle_chassis_number",
            "vehicle_engine_number",

            # Financial
            "selling_price",
            "evaluation",
            "advance_amount",
            "balance_amount",

            # Status / remark
            "status",
            "remark",

            # Dates
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields

    def get_agent_name(self, obj):
        if not obj.agent:
            return None

        full_name = " ".join(
            part
            for part in [
                obj.agent.first_name,
                obj.agent.last_name,
            ]
            if part
        ).strip()

        return full_name or obj.agent.email
        
# =========================================================
# CASH DEAL CREATE
# =========================================================

class CashDealCreateSerializer(
    serializers.Serializer
):
    quote_id = serializers.IntegerField()
    
    
# =========================================================
# CASH DEAL UPDATE
# =========================================================

class CashDealUpdateSerializer(
    serializers.Serializer
):
    advance_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
        required=False,
    )

    remark = serializers.CharField(
        max_length=5000,
        required=False,
        allow_blank=True,
    )

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "At least one field is required."
            )

        return attrs
    
    
# =========================================================
# CASH RECEIPT RESPONSE
# =========================================================

class CashReceiptSerializer(
    serializers.ModelSerializer
):
    customer_name = serializers.CharField(
        source="customer.customer_name",
        read_only=True,
    )

    quote_number = serializers.CharField(
        source="quote.quote_number",
        read_only=True,
    )

    vehicle_stock_id = serializers.CharField(
        source="car.stock_id",
        read_only=True,
        allow_null=True,
    )

    vehicle_make = serializers.CharField(
        source="car.make",
        read_only=True,
        allow_null=True,
    )

    vehicle_model = serializers.CharField(
        source="car.model",
        read_only=True,
        allow_null=True,
    )
    
    is_reversal = serializers.SerializerMethodField()
    reversed_receipt_id = serializers.SerializerMethodField()

    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CashReceipt

        fields = [
            "id",
            "receipt_number",

            # Relationships
            "customer",
            "customer_name",
            "quote",
            "quote_number",
            "car",
            "quote_expense",
            "emi_expense",

            # Vehicle display context
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",

            # Transaction
            "direction",
            "category",
            "amount",
            "payment_method",

            # Details
            "description",
            "reference",
            "transaction_date",

            # Traceability
            "source",
            "created_by",
            "created_by_name",
            
            "is_reversal",
            "reversed_receipt_id",
            

            # Dates
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None

        full_name = (
            f"{obj.created_by.first_name} "
            f"{obj.created_by.last_name}"
        ).strip()

        return (
            full_name
            or obj.created_by.email
            or obj.created_by.phone
        )
        
    def get_is_reversal(self, obj):
        return obj.reversal_of_id is not None


    def get_reversed_receipt_id(self, obj):
        reversal = getattr(
            obj,
            "reversal",
            None,
        )

        return reversal.id if reversal else None


# =========================================================
# CASH RECEIPT CREATE
# =========================================================

class CashReceiptCreateSerializer(
    serializers.Serializer
):
    customer_id = serializers.IntegerField()

    quote_id = serializers.IntegerField()

    car_id = serializers.UUIDField(
        required=False,
        allow_null=True,
    )
    
    quote_expense_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    emi_expense_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    direction = serializers.ChoiceField(
        choices=CashReceipt.Direction.choices,
    )

    category = serializers.CharField(
        max_length=255,
        required=True,
    )

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    payment_method = serializers.ChoiceField(
        choices=CashReceipt.PaymentMethod.choices,
    )

    description = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=5000,
    )

    transaction_date = serializers.DateField(
        required=False,
        allow_null=True,
    )

    reference = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )

    def validate_description(self, value):
        return value.strip()

    def validate_reference(self, value):
        return value.strip()
    
    def validate_category(self, value):
        from .services import validate_cash_receipt_category

        return validate_cash_receipt_category(value)

    def validate(self, attrs):
        category = attrs.get("category")
        description = attrs.get("description", "")

        if (
            category == CashReceipt.Category.OTHER
            and not description.strip()
        ):
            raise serializers.ValidationError(
                {
                    "description":
                        "Description is required when category is Other."
                }
            )

        return attrs


# =========================================================
# CASH RECEIPT UPDATE
# =========================================================

class CashReceiptUpdateSerializer(
    serializers.Serializer
):
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=5000,
    )

    reference = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )

    def validate_description(self, value):
        return value.strip()

    def validate_reference(self, value):
        return value.strip()

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "At least one field is required."
            )

        return attrs
    
    
class BalanceSheetSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.customer_name",
        read_only=True,
    )
    customer_mobile = serializers.CharField(
        source="customer.phone_number",
        read_only=True,
        allow_null=True,
    )
    quote_number = serializers.CharField(
        source="quote.quote_number",
        read_only=True,
    )
    payment_method = serializers.CharField(
        source="quote.payment_method",
        read_only=True,
    )
    quote_status = serializers.CharField(
        source="quote.status",
        read_only=True,
    )

    vehicle_stock_id = serializers.SerializerMethodField()
    vehicle_make = serializers.SerializerMethodField()
    vehicle_model = serializers.SerializerMethodField()
    vehicle_variant = serializers.SerializerMethodField()
    vehicle_year = serializers.SerializerMethodField()
    vehicle_colour = serializers.SerializerMethodField()
    vehicle_chassis_number = serializers.SerializerMethodField()

    master_overrides = serializers.JSONField(
        read_only=True,
    )
    selling_price = serializers.SerializerMethodField()
    evaluation = serializers.SerializerMethodField()

    agent_id = serializers.SerializerMethodField()
    agent_name = serializers.SerializerMethodField()

    cash_deal_id = serializers.SerializerMethodField()

    bank_loan_id = serializers.SerializerMethodField()
    bank_name = serializers.SerializerMethodField()
    requested_finance = serializers.SerializerMethodField()
    approved_finance = serializers.SerializerMethodField()

    net_difference = serializers.SerializerMethodField()
    balance_status = serializers.SerializerMethodField()

    transactions = serializers.SerializerMethodField()

    total_received = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    spent_breakdown = serializers.SerializerMethodField()

    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = BalanceSheet

        fields = [
            "id",
            "quote",
            "quote_number",
            "quote_status",
            "payment_method",

            "customer",
            "customer_name",
            "customer_mobile",

            "car",
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_variant",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_chassis_number",
            
            "selling_price",
            "evaluation",

            "agent_id",
            "agent_name",

            "cash_deal_id",

            "bank_loan_id",
            "bank_name",
            "requested_finance",
            "approved_finance",

            "total_received",
            "total_spent",
            "spent_breakdown",
            "net_difference",
            "balance_status",

            "transactions",
            
            "master_overrides",

            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields

    def _get_vehicle_value(self, obj, field):
        car = getattr(obj, "car", None)

        if car is not None:
            value = getattr(car, field, None)
            if value is not None:
                return value

        quote = getattr(obj, "quote", None)

        if quote is not None:
            value = getattr(quote, field, None)

            if value is not None:
                return value

            emi_sheet = getattr(quote, "emi_sheet", None)

            if emi_sheet is not None:
                return getattr(emi_sheet, field, None)

        return None

    def get_vehicle_stock_id(self, obj):
        return self._get_vehicle_value(
            obj,
            "vehicle_stock_id",
        )

    def get_vehicle_make(self, obj):
        return self._get_vehicle_value(
            obj,
            "vehicle_make",
        )

    def get_vehicle_model(self, obj):
        return self._get_vehicle_value(
            obj,
            "vehicle_model",
        )

    def get_vehicle_variant(self, obj):
        return self._get_vehicle_value(
            obj,
            "vehicle_variant",
        )

    def get_vehicle_year(self, obj):
        return self._get_vehicle_value(
            obj,
            "vehicle_year",
        )

    def get_vehicle_colour(self, obj):
        return self._get_vehicle_value(
            obj,
            "vehicle_colour",
        )

    def get_vehicle_chassis_number(self, obj):
        return self._get_vehicle_value(
            obj,
            "vehicle_chassis_number",
        )

    def get_total_received(self, obj):
        return (
            CashReceipt.objects
            .filter(
                quote_id=obj.quote_id,
                direction=CashReceipt.Direction.CUSTOMER_PAYMENT,
            )
            .aggregate(
                total=Sum("amount")
            )
            .get("total")
            or 0
        )

    def get_total_spent(self, obj):
        quote = obj.quote

        quote_amount = (
            getattr(quote, "price", None)
            or Decimal("0.00")
        )

        company_on_behalf = (
            CashReceipt.objects
            .filter(
                quote_id=obj.quote_id,
                direction=CashReceipt.Direction.COMPANY_ON_BEHALF,
            )
            .aggregate(total=Sum("amount"))
            .get("total")
            or Decimal("0.00")
        )

        return quote_amount + company_on_behalf

    def get_spent_breakdown(self, obj):
        quote = obj.quote

        vehicle_price = (
            getattr(obj.car, "asking_price", None)
            or Decimal("0.00")
        )

        quote_vat = (
            getattr(quote, "vat_amount", None)
            or Decimal("0.00")
        )

        quote_expenses = (
            quote.expenses
            .filter(
                actual_amount__isnull=False,
                applies=True,
            )
            .order_by("created_at")
        )

        breakdown = [
            {
                "type": "quote_amount",
                "narration": "Vehicle Price",
                "amount": vehicle_price,
            }
        ]

        if quote_vat > 0:
            breakdown.append(
                {
                    "type": "vat",
                    "narration": "VAT",
                    "amount": quote_vat,
                }
            )

        for expense in quote_expenses:
            breakdown.append(
                {
                    "type": "quote_expense",
                    "narration": expense.name or expense.expense_type,
                    "amount": expense.actual_amount,
                    "expense_id": expense.id,
                    "expense_type": expense.expense_type,
                }
            )

        company_receipts = (
            CashReceipt.objects
            .filter(
                quote_id=obj.quote_id,
                direction=CashReceipt.Direction.COMPANY_ON_BEHALF,
            )
            .order_by(
                "transaction_date",
                "created_at",
            )
        )

        for receipt in company_receipts:
            breakdown.append(
                {
                    "type": "company_on_behalf",
                    "narration": (
                        receipt.description
                        or receipt.category
                        or "Company Expense"
                    ),
                    "amount": receipt.amount,
                    "receipt_id": receipt.id,
                    "receipt_number": receipt.receipt_number,
                    "transaction_date": receipt.transaction_date,
                }
            )

        return breakdown

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None

        full_name = (
            f"{obj.created_by.first_name} "
            f"{obj.created_by.last_name}"
        ).strip()

        return (
            full_name
            or obj.created_by.email
            or obj.created_by.phone
        )
        
    def get_selling_price(self, obj):
        return getattr(
            obj.quote,
            "selling_price",
            getattr(obj.quote, "price", None),
        )

    def get_evaluation(self, obj):
        if obj.quote.payment_method == "Cash":
            cash_deal = (
                CashDeal.objects
                .filter(
                    quote_id=obj.quote_id,
                )
                .order_by("-created_at")
                .first()
            )

            return (
                getattr(cash_deal, "evaluation", None)
                if cash_deal
                else None
            )

        emi_sheet = getattr(
            obj.quote,
            "emi_sheet",
            None,
        )

        if emi_sheet:
            return getattr(
                emi_sheet,
                "car_value_evaluation",
                None,
            )

        return None

    def get_agent_id(self, obj):
        return (
            obj.quote.salesperson_id
            if obj.quote
            else None
        )

    def get_agent_name(self, obj):
        agent = (
            obj.quote.salesperson
            if obj.quote
            else None
        )

        if not agent:
            return None

        full_name = (
            f"{agent.first_name} "
            f"{agent.last_name}"
        ).strip()

        return (
            full_name
            or agent.email
            or agent.phone
        )

    def get_cash_deal_id(self, obj):
        return (
            CashDeal.objects
            .filter(
                quote_id=obj.quote_id,
            )
            .values_list(
                "id",
                flat=True,
            )
            .first()
        )

    def get_bank_loan_id(self, obj):
        return (
            BankLoan.objects
            .filter(
                quote_id=obj.quote_id,
            )
            .order_by("-created_at")
            .values_list(
                "id",
                flat=True,
            )
            .first()
        )

    def get_bank_name(self, obj):
        bank_loan = (
            BankLoan.objects
            .filter(
                quote_id=obj.quote_id,
            )
            .order_by("-created_at")
            .first()
        )

        return (
            bank_loan.bank_name
            if bank_loan
            else None
        )

    def get_requested_finance(self, obj):
        bank_loan = (
            BankLoan.objects
            .filter(
                quote_id=obj.quote_id,
            )
            .order_by("-created_at")
            .first()
        )

        return (
            bank_loan.requested_finance
            if bank_loan
            else None
        )

    def get_approved_finance(self, obj):
        bank_loan = (
            BankLoan.objects
            .filter(
                quote_id=obj.quote_id,
            )
            .order_by("-created_at")
            .first()
        )

        return (
            bank_loan.approved_finance
            if bank_loan
            else None
        )

    def get_net_difference(self, obj):
        return (
            self.get_total_received(obj)
            - self.get_total_spent(obj)
        )

        company_on_behalf = (
            CashReceipt.objects
            .filter(
                quote_id=obj.quote_id,
                direction=CashReceipt.Direction.COMPANY_ON_BEHALF,
            )
            .aggregate(
                total=Sum("amount")
            )
            .get("total")
            or Decimal("0.00")
        )

        return customer_received - company_on_behalf

    def get_balance_status(self, obj):
        net = self.get_net_difference(obj)

        if net == 0:
            return "settled"

        if net > 0:
            return "customer_receivable"

        return "customer_payable"

    def get_transactions(self, obj):
        receipts = (
            CashReceipt.objects
            .filter(
                quote_id=obj.quote_id,
            )
            .select_related(
                "customer",
                "created_by",
            )
            .order_by(
                "transaction_date",
                "created_at",
            )
        )

        return CashReceiptSerializer(
            receipts,
            many=True,
        ).data
        
    def to_representation(self, instance):
        data = super().to_representation(instance)

        overrides = instance.master_overrides or {}

        protected_fields = {
            "total_received",
            "total_spent",
            "net_difference",
            "balance_status",
            "spent_breakdown",
            "transactions",
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "created_by_name",
            "master_overrides",
        }

        for field, value in overrides.items():
            if field not in protected_fields:
                data[field] = value

        return data

class BalanceSheetListSerializer(
        BalanceSheetSerializer
    ):
        class Meta(BalanceSheetSerializer.Meta):
            fields = [
                field
                for field in BalanceSheetSerializer.Meta.fields
                if field != "transactions"
            ]

            read_only_fields = fields
    
class BalanceSheetCreateSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField(
        required=True,
    )

    quote_id = serializers.IntegerField(
        required=True,
    )
        
class BalanceSheetMasterUpdateSerializer(
    serializers.Serializer
):
    master_overrides = serializers.JSONField(
        required=True,
    )

    # These fields are always controlled by backend calculations/history.
    PROTECTED_FIELDS = {
        "total_received",
        "total_spent",
        "net_difference",
        "balance_status",
        "transactions",
        "id",
        "created_at",
        "updated_at",
        "created_by",
        "created_by_name",
    }

    def validate_master_overrides(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "master_overrides must be a JSON object."
            )

        protected = (
            set(value.keys())
            & self.PROTECTED_FIELDS
        )

        if protected:
            raise serializers.ValidationError(
                {
                    "protected_fields": (
                        "These fields cannot be manually "
                        "configured: "
                        + ", ".join(sorted(protected))
                    )
                }
            )

        return value