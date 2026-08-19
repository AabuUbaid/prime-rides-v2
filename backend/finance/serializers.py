from decimal import Decimal

import attrs
from rest_framework import serializers

from inventory.models import Car

from .models import Bank, EmiExpense, EmiSheet


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

    def validate(self, attrs):
        vehicle_price = attrs[
            "vehicle_price"
        ]

        down_payment = attrs[
            "down_payment"
        ]

        if down_payment > vehicle_price:
            raise serializers.ValidationError(
                {
                    "down_payment": (
                        "Down payment cannot "
                        "exceed vehicle price."
                    )
                }
            )

        return attrs


# =========================================================
# EMI EXPENSE INPUT
# =========================================================


class EmiExpenseInputSerializer(
    serializers.Serializer
):
    expense_type = serializers.ChoiceField(
        choices=EmiExpense.ExpenseType.choices,
    )

    description = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )


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

        return attrs

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
            "tenure_years",

            # Results
            "total_interest",
            "total_payable",
            "monthly_emi",

            # Status
            "status",

            # Expenses
            "expenses",

            # Dates
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields