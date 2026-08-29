from decimal import Decimal

from rest_framework import serializers

from inventory.models import Car

from .models import (
    Bank,
    BankProcessingConfiguration,
    EmiExpense,
    EmiSheet,
    ExpensePreset,
    InsuranceBand,
    ServicePackage,
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
    expense_type = serializers.ChoiceField(
        choices=[
            ("rta", "RTA Passing"),
            ("registration", "Registration"),
            ("evaluation", "Evaluation"),
            ("bank_process", "Bank Processing"),
            ("insurance", "Insurance"),
        ],
    )

    description = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )

    def validate(self, attrs):
        return attrs


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