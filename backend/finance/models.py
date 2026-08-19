from decimal import Decimal

from django.db import models

from inventory.models import Car


class Bank(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
    )

    interest_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
    )

    is_cash = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "finance_banks"
        ordering = ["name"]

        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    interest_rate__gte=Decimal("0.00")
                ),
                name="bank_interest_rate_non_negative",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(is_cash=False)
                    | models.Q(
                        interest_rate=Decimal("0.00")
                    )
                ),
                name="cash_bank_zero_interest",
            ),
        ]

class EmiSequence(models.Model):
    """
    Database-backed counter used to generate
    concurrency-safe EMI numbers.
    """

    name = models.CharField(
        max_length=50,
        unique=True,
    )

    current_number = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        db_table = "finance_emi_sequences"

    def __str__(self):
        return (
            f"{self.name}: "
            f"{self.current_number}"
        )

class EmiSheet(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CANCELLED = "cancelled", "Cancelled"

    emi_number = models.CharField(
        max_length=30,
        unique=True,
    )

    # -------------------------------------------------
    # Customer
    # -------------------------------------------------

    customer_name = models.CharField(
        max_length=255,
    )

    customer_mobile = models.CharField(
        max_length=30,
    )

    # -------------------------------------------------
    # Vehicle relationship
    # -------------------------------------------------

    car = models.ForeignKey(
        Car,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="emi_sheets",
    )

    # -------------------------------------------------
    # Historical vehicle snapshot
    # -------------------------------------------------

    vehicle_stock_id = models.CharField(
        max_length=50,
    )

    vehicle_make = models.CharField(
        max_length=100,
    )

    vehicle_model = models.CharField(
        max_length=100,
    )

    vehicle_variant = models.CharField(
        max_length=100,
        blank=True,
    )

    vehicle_year = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    vehicle_colour = models.CharField(
        max_length=50,
        blank=True,
    )

    vehicle_mileage = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    vehicle_chassis_number = models.CharField(
        max_length=100,
        blank=True,
    )

    vehicle_engine_number = models.CharField(
        max_length=100,
        blank=True,
    )
    # -------------------------------------------------
    # Finance source
    # -------------------------------------------------

    bank = models.ForeignKey(
        Bank,
        on_delete=models.PROTECT,
        related_name="emi_sheets",
    )

    # Historical bank/rate snapshot
    bank_name = models.CharField(
        max_length=150,
    )

    manual_rate_used = models.BooleanField(
        default=False,
    )

    interest_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
    )

    # -------------------------------------------------
    # Vehicle / finance calculation inputs
    # -------------------------------------------------

    vehicle_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    vat_enabled = models.BooleanField(
        default=False,
    )

    vat_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    price_after_vat = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    down_payment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    finance_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    tenure_years = models.PositiveIntegerField()

    # -------------------------------------------------
    # Calculation results
    # -------------------------------------------------

    total_interest = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    total_payable = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    monthly_emi = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    # -------------------------------------------------
    # Status
    # -------------------------------------------------

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "finance_emi_sheets"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["emi_number"]
            ),
            models.Index(
                fields=["customer_name"]
            ),
            models.Index(
                fields=["customer_mobile"]
            ),
            models.Index(
                fields=["vehicle_stock_id"]
            ),
            models.Index(
                fields=["created_at"]
            ),
        ]

    def __str__(self):
        return (
            f"{self.emi_number} - "
            f"{self.customer_name}"
        )


class EmiExpense(models.Model):
    class ExpenseType(models.TextChoices):
        EVALUATION = (
            "evaluation",
            "Evaluation",
        )
        BANK_PROCESS = (
            "bank_process",
            "Bank Process",
        )
        RTA = (
            "rta",
            "RTA",
        )
        INSURANCE = (
            "insurance",
            "Insurance",
        )
        REGISTRATION = (
            "registration",
            "Registration",
        )

    emi_sheet = models.ForeignKey(
        EmiSheet,
        on_delete=models.CASCADE,
        related_name="expenses",
    )

    expense_type = models.CharField(
        max_length=30,
        choices=ExpenseType.choices,
    )

    description = models.CharField(
        max_length=255,
        blank=True,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "finance_emi_expenses"
        ordering = ["id"]

    def __str__(self):
        return (
            f"{self.emi_sheet.emi_number} - "
            f"{self.get_expense_type_display()}"
        )


