from decimal import Decimal

from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
)
from django.db import models
from inventory.models import Car

from customers.models import Customer
# =========================================================
# BANK
# =========================================================


class Bank(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
    )

    interest_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
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
                    interest_rate__gte=Decimal("0.00"),
                ),
                name="bank_interest_rate_non_negative",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(is_cash=False)
                    | models.Q(
                        interest_rate=Decimal("0.00"),
                    )
                ),
                name="cash_bank_zero_interest",
            ),
        ]

    def __str__(self):
        return self.name


# =========================================================
# EXPENSE PRESETS
# =========================================================


class ExpensePreset(models.Model):
    class CalculationType(models.TextChoices):
        FIXED = "fixed", "Fixed amount"
        PERCENTAGE_MINIMUM = (
            "percentage_minimum",
            "Percentage with minimum",
        )
        CONDITIONAL = "conditional", "Conditional value"

    name = models.CharField(
        max_length=150,
    )

    expense_type = models.CharField(
        max_length=80,
    )

    calculation_type = models.CharField(
        max_length=30,
        choices=CalculationType.choices,
        default=CalculationType.FIXED,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    percentage = models.DecimalField(
        max_digits=7,
        decimal_places=4,
        null=True,
        blank=True,
    )

    minimum_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    condition_key = models.CharField(
        max_length=80,
        blank=True,
    )

    condition_value = models.CharField(
        max_length=80,
        blank=True,
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
        db_table = "finance_expense_presets"
        ordering = [
            "expense_type",
            "name",
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    amount__gte=Decimal("0.00"),
                ),
                name="expense_preset_amount_non_negative",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(percentage__isnull=True)
                    | models.Q(
                        percentage__gte=Decimal("0.00"),
                    )
                ),
                name="expense_preset_percentage_non_negative",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(minimum_amount__isnull=True)
                    | models.Q(
                        minimum_amount__gte=Decimal("0.00"),
                    )
                ),
                name="expense_preset_minimum_non_negative",
            ),
            models.UniqueConstraint(
                fields=[
                    "expense_type",
                    "name",
                ],
                name="unique_expense_preset_type_name",
            ),
        ]

    def __str__(self):
        return f"{self.name} - {self.expense_type}"


# =========================================================
# INSURANCE BANDS
# =========================================================


class InsuranceBand(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
    )

    minimum_vehicle_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    maximum_vehicle_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    no_license_surcharge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
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
        db_table = "finance_insurance_bands"
        ordering = [
            "minimum_vehicle_price",
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    minimum_vehicle_price__gte=Decimal("0.00"),
                ),
                name="insurance_band_min_price_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    maximum_vehicle_price__gt=models.F(
                        "minimum_vehicle_price",
                    ),
                ),
                name="insurance_band_max_greater_than_min",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    amount__gte=Decimal("0.00"),
                ),
                name="insurance_band_amount_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    no_license_surcharge__gte=Decimal("0.00"),
                ),
                name="insurance_band_no_license_surcharge_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.name} - {self.amount}"


# =========================================================
# SERVICE PACKAGE
# =========================================================


class ServicePackage(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
    )

    description = models.CharField(
        max_length=255,
        blank=True,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    is_active = models.BooleanField(
        default=True,
    )

    is_default = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "finance_service_packages"
        ordering = ["name"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    amount__gte=Decimal("0.00"),
                ),
                name="service_package_amount_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.name} - {self.amount}"


# =========================================================
# BANK PROCESSING CONFIGURATION
# =========================================================


class BankProcessingConfiguration(models.Model):
    bank = models.OneToOneField(
        Bank,
        on_delete=models.CASCADE,
        related_name="processing_configuration",
    )

    percentage = models.DecimalField(
        max_digits=7,
        decimal_places=4,
        default=Decimal("1.2500"),
        validators=[
            MinValueValidator(Decimal("0.0000")),
        ],
    )

    minimum_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("540.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    application_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
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
        db_table = "finance_bank_processing_configurations"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    percentage__gte=Decimal("0.0000"),
                ),
                name="bank_processing_percentage_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    minimum_amount__gte=Decimal("0.00"),
                ),
                name="bank_processing_minimum_amount_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    application_charge__gte=Decimal("0.00"),
                ),
                name="bank_processing_application_charge_non_negative",
            ),
        ]

    def __str__(self):
        return (
            f"{self.bank.name} - "
            f"{self.percentage}% / "
            f"{self.minimum_amount}"
        )

# =========================================================
# EMI SEQUENCE
# =========================================================


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

    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="emi_sheets",
    )

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

    car_value_evaluation = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    expense_selection = models.JSONField(
        default=dict,
        blank=True,
    )

    expense_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    emi_principal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    tenure_years = models.PositiveIntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(5),
        ],
    )
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
    # Historical pricing/configuration snapshot
    # -------------------------------------------------

    evaluation_name = models.CharField(
        max_length=150,
        blank=True,
    )

    evaluation_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    bank_processing_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    insurance_band_name = models.CharField(
        max_length=150,
        blank=True,
    )

    insurance_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    registration_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    rta_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    service_package_name = models.CharField(
        max_length=150,
        blank=True,
    )

    service_package_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    service_package_selected = models.BooleanField(
        default=False,
    )

    include_other_expenses = models.BooleanField(
        default=True,
    )

    registration_dubai = models.BooleanField(
        default=False,
    )

    driving_license = models.BooleanField(
        default=True,
    )

    insurance_surcharge_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    banker_application_charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    unit_price_after_down_payment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
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
    emi_sheet = models.ForeignKey(
        EmiSheet,
        on_delete=models.CASCADE,
        related_name="expenses",
    )

    expense_type = models.CharField(
        max_length=80,
    )

    name = models.CharField(
        max_length=150,
        blank=True,
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
