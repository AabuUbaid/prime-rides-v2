from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from finance.models import EmiSheet
from inventory.models import Car
from customers.models import Customer


class Quote(models.Model):
    class Source(models.TextChoices):
        STOCK = "stock", "Current Stock"
        SAVED_EMI = "saved_emi", "Saved EMI Calculation"

    class Status(models.TextChoices):
        QUOTE = "quote", "Quote"
        BOOKED = "booked", "Booked"
        SOLD = "sold", "Sold"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentMethod(models.TextChoices):
        CASH = "Cash", "Cash"
        FINANCE = "Finance", "Finance"

    # ...

    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
        blank=True,
    )

    quote_number = models.CharField(
        max_length=30,
        unique=True,
    )

    source = models.CharField(
        max_length=20,
        choices=Source.choices,
    )

    # -------------------------------------------------
    # Source relationships
    # -------------------------------------------------

    car = models.ForeignKey(
        Car,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotes",
    )

    emi_sheet = models.ForeignKey(
        EmiSheet,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="quotes",
    )

    # -------------------------------------------------
    # Customer
    # -------------------------------------------------
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotes",
    )
    customer_name = models.CharField(
        max_length=255,
    )

    customer_mobile = models.CharField(
        max_length=30,
    )

    # -------------------------------------------------
    # Salesperson
    # -------------------------------------------------

    salesperson = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotes",
    )

    # -------------------------------------------------
    # Historical vehicle snapshot
    # -------------------------------------------------

    vehicle_stock_id = models.CharField(
        max_length=50,
        blank=True,
    )

    vehicle_make = models.CharField(
        max_length=100,
        blank=True,
    )

    vehicle_model = models.CharField(
        max_length=100,
        blank=True,
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
    # Quotation financial information
    # -------------------------------------------------

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    down_payment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    extra_down_payment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    deposit_date = models.DateField(
        null=True,
        blank=True,
    )

    # -------------------------------------------------
    # Historical EMI financial snapshot
    #
    # Populated when source = saved_emi.
    # This prevents the Quote from depending on a
    # mutable current EMI calculation for historical
    # display.
    # -------------------------------------------------

    emi_bank_name = models.CharField(
        max_length=150,
        blank=True,
    )

    emi_interest_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    emi_vehicle_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    emi_vat_enabled = models.BooleanField(
        null=True,
        blank=True,
    )

    emi_vat_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    emi_down_payment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    emi_finance_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    emi_expense_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    emi_tenure_years = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    emi_total_interest = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    emi_total_payable = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    emi_monthly_emi = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # -------------------------------------------------
    # Status
    # -------------------------------------------------

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.QUOTE,
    )

    # -------------------------------------------------
    # Timestamps
    # -------------------------------------------------

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "quotes"
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["quote_number"],
            ),
            models.Index(
                fields=["status"],
            ),
            models.Index(
                fields=["source"],
            ),
            models.Index(
                fields=["customer_name"],
            ),
            models.Index(
                fields=["customer_mobile"],
            ),
            models.Index(
                fields=["vehicle_stock_id"],
            ),
            models.Index(
                fields=["vehicle_chassis_number"],
            ),
            models.Index(
                fields=["vehicle_engine_number"],
            ),
            models.Index(
                fields=["created_at"],
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    down_payment__gte=Decimal("0.00"),
                ),
                name="quote_down_payment_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    extra_down_payment__gte=Decimal("0.00"),
                ),
                name="quote_extra_down_payment_non_negative",
            ),
        ]

    def __str__(self):
        return (
            f"{self.quote_number} - "
            f"{self.customer_name}"
        )


class QuoteSequence(models.Model):
    """
    Database-backed counter for collision-safe
    Quote number generation.
    """

    name = models.CharField(
        max_length=50,
        unique=True,
    )

    current_number = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        db_table = "quotes_sequences"

    def __str__(self):
        return (
            f"{self.name}: "
            f"{self.current_number}"
        )


class QuoteExpense(models.Model):
    """
    Internal Quote expense.

    Estimated values represent the quotation-stage
    expectation.

    Actual amount represents the amount actually
    incurred later at delivery/settlement.
    """

    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name="expenses",
    )

    expense_type = models.CharField(
        max_length=80,
    )

    name = models.CharField(
        max_length=150,
    )

    description = models.CharField(
        max_length=255,
        blank=True,
    )

    estimated_min = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    estimated_max = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    actual_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    applies = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "quote_expenses"
        ordering = ["id"]

        indexes = [
            models.Index(
                fields=["quote", "expense_type"],
            ),
            models.Index(
                fields=["expense_type"],
            ),
        ]

        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(estimated_min__isnull=True)
                    | models.Q(
                        estimated_min__gte=Decimal("0.00"),
                    )
                ),
                name="quote_expense_estimated_min_non_negative",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(estimated_max__isnull=True)
                    | models.Q(
                        estimated_max__gte=Decimal("0.00"),
                    )
                ),
                name="quote_expense_estimated_max_non_negative",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(actual_amount__isnull=True)
                    | models.Q(
                        actual_amount__gte=Decimal("0.00"),
                    )
                ),
                name="quote_expense_actual_non_negative",
            ),
        ]

    def __str__(self):
        return (
            f"{self.quote.quote_number} - "
            f"{self.name}"
        )