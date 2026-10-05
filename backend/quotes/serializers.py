from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import serializers

from finance.models import EmiSheet
from inventory.models import Car

from .models import Quote, QuoteExpense
from customers.models import CustomerDocument
from customers.serializers import CustomerDocumentSerializer
from finance.models import BankLoan, CashDeal

User = get_user_model()


# =========================================================
# QUOTE EXPENSE
# =========================================================

class QuoteExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteExpense
        fields = (
            "id",
            "expense_type",
            "name",
            "description",
            "estimated_min",
            "estimated_max",
            "actual_amount",
            "applies",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        estimated_min = attrs.get("estimated_min")
        estimated_max = attrs.get("estimated_max")

        if (
            estimated_min is not None
            and estimated_max is not None
            and estimated_max < estimated_min
        ):
            raise serializers.ValidationError(
                {
                    "estimated_max": (
                        "Estimated maximum cannot be less "
                        "than estimated minimum."
                    )
                }
            )

        return attrs


# =========================================================
# QUOTE EXPENSE CREATE
# =========================================================

class QuoteExpenseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteExpense
        fields = (
        "expense_type",
        "name",
        "description",
        "estimated_min",
        "estimated_max",
        "actual_amount",
        "applies",
    )

    def validate(self, attrs):
        estimated_min = attrs.get("estimated_min")
        estimated_max = attrs.get("estimated_max")

        if (
            estimated_min is not None
            and estimated_max is not None
            and estimated_max < estimated_min
        ):
            raise serializers.ValidationError(
                {
                    "estimated_max": (
                        "Estimated maximum cannot be less "
                        "than estimated minimum."
                    )
                }
            )

        return attrs


# =========================================================
# QUOTE EXPENSE ACTUAL UPDATE
# =========================================================

class QuoteExpenseActualUpdateSerializer(
    serializers.Serializer
):
    id = serializers.IntegerField()

    actual_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
        allow_null=True,
        required=False,
    )

    applies = serializers.BooleanField(
        required=False,
    )


# =========================================================
# QUOTE CREATE
# =========================================================

class QuoteCreateSerializer(serializers.ModelSerializer):

    car_id = serializers.PrimaryKeyRelatedField(
        source="car",
        queryset=Car.objects.all(),
        required=False,
        allow_null=True,
    )

    emi_sheet_id = serializers.PrimaryKeyRelatedField(
        source="emi_sheet",
        queryset=EmiSheet.objects.all(),
        required=False,
        allow_null=True,
    )

    salesperson_id = serializers.PrimaryKeyRelatedField(
        source="salesperson",
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
    )

    expenses = QuoteExpenseCreateSerializer(
        many=True,
        required=False,
    )

    # -----------------------------------------------------
    # Final business rule:
    # Cash / Finance only
    # -----------------------------------------------------

    payment_method = serializers.ChoiceField(
        choices=Quote.PaymentMethod.choices,
        required=True,
    )
    
    special_price_request_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Quote
        fields = (
            "source",
            "car_id",
            "emi_sheet_id",
            "customer_name",
            "customer_mobile",
            "salesperson_id",
            "price",
            "payment_method",

            "vat_enabled",
            "vat_amount",

            "extra_down_payment",
            "deposit_date",
            "expenses",
            "special_price_request_id",
        )

    def validate(self, attrs):
        source = attrs.get("source")
        car = attrs.get("car")
        emi_sheet = attrs.get("emi_sheet")
        payment_method = attrs.get("payment_method")

        vat_enabled = attrs.get(
            "vat_enabled",
            False,
        )

        vat_amount = attrs.get(
            "vat_amount",
            Decimal("0.00"),
        )

        # -------------------------------------------------
        # STOCK SOURCE
        # -------------------------------------------------

        if source == Quote.Source.STOCK:

            if car is None:
                raise serializers.ValidationError(
                    {
                        "car_id": (
                            "A vehicle is required when "
                            "source is stock."
                        )
                    }
                )

            if emi_sheet is not None:
                raise serializers.ValidationError(
                    {
                        "emi_sheet_id": (
                            "EMI sheet must not be supplied "
                            "for a stock quote."
                        )
                    }
                )

            # Stock quotes are always Cash.
            if payment_method != Quote.PaymentMethod.CASH:
                raise serializers.ValidationError(
                    {
                        "payment_method": (
                            "Stock quotes must use Cash payment."
                        )
                    }
                )

            # Reserved vehicles are not quoteable.
            # Only AVAILABLE and RESERVED vehicles can be quoted.
            allowed_statuses = {
                Car.Status.AVAILABLE,
                Car.Status.RESERVED,
            }

            if car.status not in allowed_statuses:
                raise serializers.ValidationError(
                    {
                        "car_id": (
                            "A Quote can only be created for a vehicle "
                            "with Available or Reserved status."
                        )
                    }
                )
        # -------------------------------------------------
        # SAVED EMI SOURCE
        # -------------------------------------------------

        elif source == Quote.Source.SAVED_EMI:

            if emi_sheet is None:
                raise serializers.ValidationError(
                    {
                        "emi_sheet_id": (
                            "An EMI sheet is required when "
                            "source is saved_emi."
                        )
                    }
                )

            if car is not None:
                raise serializers.ValidationError(
                    {
                        "car_id": (
                            "Car must not be supplied "
                            "for a saved EMI quote."
                        )
                    }
                )

            # Saved EMI quotes are always Finance.
            if payment_method != Quote.PaymentMethod.FINANCE:
                raise serializers.ValidationError(
                    {
                        "payment_method": (
                            "Saved EMI quotes must use "
                            "Finance payment."
                        )
                    }
                )

        # -------------------------------------------------
        # SOURCE INVALID
        # -------------------------------------------------

        else:
            raise serializers.ValidationError(
                {
                    "source": (
                        "A valid Quote source is required."
                    )
                }
            )

                # -------------------------------------------------
        # VAT SNAPSHOT VALIDATION
        # -------------------------------------------------

        if vat_amount is None:
            vat_amount = Decimal("0.00")

        if vat_amount < Decimal("0.00"):
            raise serializers.ValidationError(
                {
                    "vat_amount": (
                        "VAT amount cannot be negative."
                    )
                }
            )

        if not vat_enabled and vat_amount != Decimal("0.00"):
            raise serializers.ValidationError(
                {
                    "vat_amount": (
                        "VAT amount must be zero when VAT "
                        "is disabled."
                    )
                }
            )

        # -------------------------------------------------
        # EXPENSE VALIDATION
        # -------------------------------------------------

        expenses = attrs.get("expenses", [])

        if not isinstance(expenses, list):
            raise serializers.ValidationError(
                {
                    "expenses": (
                        "Expected a list of expense items."
                    )
                }
            )

        return attrs


# =========================================================
# QUOTE UPDATE
# =========================================================

class QuoteUpdateSerializer(serializers.ModelSerializer):

    salesperson_id = serializers.PrimaryKeyRelatedField(
        source="salesperson",
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
    )

    expense_updates = QuoteExpenseActualUpdateSerializer(
        many=True,
        required=False,
    )

    class Meta:
        model = Quote
        fields = (
            "salesperson_id",
            "extra_down_payment",
            "deposit_date",
            "status",
            "expense_updates",
        )

    def validate(self, attrs):
        request_data = self.initial_data

        allowed_fields = {
            "salesperson_id",
            "extra_down_payment",
            "deposit_date",
            "status",
            "expense_updates",
        }

        unexpected_fields = (
            set(request_data.keys()) - allowed_fields
        )

        # -------------------------------------------------
        # Preserve current approved behavior:
        #
        # Protected fields supplied by the client are
        # ignored rather than modified.
        #
        # Only explicitly exposed editable fields above
        # reach update_quote().
        # -------------------------------------------------

        _ = unexpected_fields

        return attrs


# =========================================================
# QUOTE LIST
# =========================================================

class QuoteListSerializer(serializers.ModelSerializer):

    salesperson_id = serializers.UUIDField(
        source="salesperson.id",
        read_only=True,
    )
    customer_id = serializers.IntegerField(
        source="customer.id",
        read_only=True,
    )

    class Meta:
        model = Quote

        fields = (
            "id",
            "quote_number",
            "source",
            "customer_id",
            "customer_name",
            "customer_mobile",
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_variant",
            "vehicle_chassis_number",
            "salesperson_id",
            "price",
            "payment_method",
            "down_payment",
            "extra_down_payment",
            "deposit_date",
            "status",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields


# =========================================================
# QUOTE DETAIL
# =========================================================

class QuoteDetailSerializer(serializers.ModelSerializer):

    salesperson_id = serializers.UUIDField(
        source="salesperson.id",
        read_only=True,
    )
    customer_id = serializers.IntegerField(
        source="customer.id",
        read_only=True,
    )

    car_id = serializers.UUIDField(
        source="car.id",
        read_only=True,
    )

    emi_sheet_id = serializers.IntegerField(
        source="emi_sheet.id",
        read_only=True,
    )

    expenses = QuoteExpenseSerializer(
        many=True,
        read_only=True,
    )

    cash_deal = serializers.SerializerMethodField()

    active_bank_loan = serializers.SerializerMethodField()

    insurance_applied = serializers.SerializerMethodField()
    loan_approved = serializers.SerializerMethodField()
    deal_closed = serializers.SerializerMethodField()

    def get_cash_deal(self, obj):
        try:
            cash_deal = obj.cash_deal
        except CashDeal.DoesNotExist:
            return None

        return {
            "id": cash_deal.id,
            "status": cash_deal.status,
        }

    def get_active_bank_loan(self, obj):
        bank_loan = (
            obj.bank_loans
            .filter(
                status__in=[
                    BankLoan.Status.PENDING,
                    BankLoan.Status.APPROVED,
                ]
            )
            .order_by("-created_at")
            .first()
        )

        if bank_loan is None:
            return None

        return {
            "id": bank_loan.id,
            "bank_name": bank_loan.bank_name,
            "status": bank_loan.status,
            "application_status": bank_loan.application_status,
            "priority": bank_loan.priority,
        }
    def get_insurance_applied(self, obj):
        try:
            return obj.insurance is not None
        except Exception:
            return False


    def get_loan_approved(self, obj):
        return obj.bank_loans.filter(
            status=BankLoan.Status.APPROVED,
        ).exists()


    def get_deal_closed(self, obj):
        try:
            cash_deal = obj.cash_deal
        except CashDeal.DoesNotExist:
            return False

        return cash_deal.status == CashDeal.Status.COMPLETED

    class Meta:
        model = Quote

        fields = (
            "id",
            "quote_number",
            "source",

            "car_id",
            "emi_sheet_id",

            "customer_id",
            "customer_name",
            "customer_mobile",

            "salesperson_id",

            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_variant",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_mileage",
            "vehicle_chassis_number",
            "vehicle_engine_number",

            "price",
            "payment_method",
            "vat_enabled",
            "vat_amount",
            "down_payment",
            "extra_down_payment",
            "deposit_date",

            "emi_bank_name",
            "emi_interest_rate",
            "emi_vehicle_price",
            "emi_vat_enabled",
            "emi_vat_amount",
            "emi_down_payment",
            "emi_finance_amount",
            "emi_expense_total",
            "emi_tenure_years",
            "emi_total_interest",
            "emi_total_payable",
            "emi_monthly_emi",

            "status",

            "cash_deal",
            "active_bank_loan",
            "insurance_applied",
            "loan_approved",
            "deal_closed",

            "expenses",

            "created_at",
            "updated_at",
        )

        read_only_fields = fields


class QuotePrintSerializer(serializers.ModelSerializer):

    customer_documents = CustomerDocumentSerializer(
        source="customer.documents",
        many=True,
        read_only=True,
    )

    expenses = QuoteExpenseSerializer(
        many=True,
        read_only=True,
    )

    validity_days = serializers.SerializerMethodField()
    valid_until = serializers.SerializerMethodField()
    finance_amount = serializers.SerializerMethodField()

    class Meta:
        model = Quote

        fields = (
            "quote_number",
            "created_at",

            # Customer
            "customer_id",
            "customer_name",
            "customer_mobile",
            "customer_documents",

            # Historical vehicle snapshot
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_variant",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_mileage",
            "vehicle_chassis_number",
            "vehicle_engine_number",

            # Quote financial information
            "price",
            "payment_method",
            "vat_enabled",
            "vat_amount",
            "down_payment",
            "extra_down_payment",
            "deposit_date",

            # Historical Finance snapshot
            "emi_bank_name",
            "emi_vat_enabled",
            "emi_vat_amount",
            "emi_finance_amount",

            # Print business rules
            "validity_days",
            "valid_until",
            "finance_amount",

            # Internal Quote expenses
            "expenses",
        )

        read_only_fields = fields

    def get_validity_days(self, instance):
        if instance.payment_method == Quote.PaymentMethod.CASH:
            return 7

        if instance.payment_method == Quote.PaymentMethod.FINANCE:
            return 30

        return None

    def get_valid_until(self, instance):
        validity_days = self.get_validity_days(instance)

        if validity_days is None or not instance.created_at:
            return None

        return instance.created_at.date() + timedelta(
            days=validity_days
        )

    def get_finance_amount(self, instance):
        if instance.payment_method != Quote.PaymentMethod.FINANCE:
            return None

        return instance.emi_finance_amount

    def to_representation(self, instance):
        data = super().to_representation(instance)

        return {
            "quote_number": data["quote_number"],
            "date": data["created_at"],

            "customer": {
                "id": data["customer_id"],
                "name": data["customer_name"],
                "mobile": data["customer_mobile"],
                "documents": data["customer_documents"],
            },

            "vehicle": {
                "stock_id": data["vehicle_stock_id"],
                "make": data["vehicle_make"],
                "model": data["vehicle_model"],
                "variant": data["vehicle_variant"],
                "year": data["vehicle_year"],
                "colour": data["vehicle_colour"],
                "mileage": data["vehicle_mileage"],
                "chassis_number": data["vehicle_chassis_number"],
                "engine_number": data["vehicle_engine_number"],
            },

            "price": data["price"],
            "payment_method": data["payment_method"],

            "vat": {
                "enabled": data["vat_enabled"],
                "amount": data["vat_amount"],
            },

            "down_payment": data["down_payment"],
            "extra_down_payment": data["extra_down_payment"],
            "deposit_date": data["deposit_date"],

            "finance": {
                "bank_name": (
                    data["emi_bank_name"]
                    if data["payment_method"]
                    == Quote.PaymentMethod.FINANCE
                    else None
                ),
                "vat_enabled": (
                    data["emi_vat_enabled"]
                    if data["payment_method"]
                    == Quote.PaymentMethod.FINANCE
                    else None
                ),
                "vat_amount": (
                    data["emi_vat_amount"]
                    if data["payment_method"]
                    == Quote.PaymentMethod.FINANCE
                    else None
                ),
                "finance_amount": data["finance_amount"],
            },

            "validity": {
                "days": data["validity_days"],
                "valid_until": data["valid_until"],
            },

            "expenses": data["expenses"],
        }
        
        
# =========================================================
# PROCEED TO BANK LOAN
# =========================================================

class QuoteProceedToBankLoanSerializer(
    serializers.Serializer
):
    bank_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )
    priority = serializers.ChoiceField(
        choices=BankLoan.Priority.choices,
        required=False,
        default=BankLoan.Priority.MEDIUM,
    )