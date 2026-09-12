from django.conf import settings
from django.db import models


class Proforma(models.Model):
    class PaymentType(models.TextChoices):
        FINANCE = "finance", "Finance"
        CASH = "cash", "Cash"

    quote = models.OneToOneField(
        "quotes.Quote",
        on_delete=models.PROTECT,
        related_name="proforma",
    )
    insurance = models.ForeignKey(
        "insurance.Insurance",
        on_delete=models.PROTECT,
        related_name="proformas",
    )

    proforma_number = models.CharField(max_length=50, unique=True)
    proforma_date = models.DateField()

    payment_type = models.CharField(
        max_length=20,
        choices=PaymentType.choices,
    )

    bank_financed_by = models.CharField(max_length=255, blank=True)
    lpo = models.CharField(max_length=100, blank=True)

    customer_name = models.CharField(max_length=255)
    customer_mobile = models.CharField(max_length=30)

    vehicle_make = models.CharField(max_length=100, blank=True)
    vehicle_model = models.CharField(max_length=100, blank=True)
    vehicle_year = models.PositiveIntegerField(null=True, blank=True)
    vehicle_chassis_number = models.CharField(max_length=100, blank=True)
    vehicle_engine_number = models.CharField(max_length=100, blank=True)
    vehicle_mileage = models.PositiveIntegerField(null=True, blank=True)

    vehicle_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    down_payment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    net_finance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    vat = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="proformas",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "proforma_records"
        ordering = ["-created_at"]

        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    vehicle_price__gte=0
                ),
                name="proforma_vehicle_price_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    down_payment__gte=0
                ),
                name="proforma_down_payment_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    vat__gte=0
                ),
                name="proforma_vat_non_negative",
            ),
        ]

    def __str__(self):
        return self.proforma_number