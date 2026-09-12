from django.conf import settings
from django.db import models


class DeliveryNote(models.Model):
    quote = models.OneToOneField(
        "quotes.Quote",
        on_delete=models.PROTECT,
        related_name="delivery_note",
    )

    insurance = models.ForeignKey(
        "insurance.Insurance",
        on_delete=models.PROTECT,
        related_name="delivery_notes",
    )

    delivery_note_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
    )

    delivery_date = models.DateField()

    customer_name = models.CharField(
        max_length=255,
    )

    vehicle_make = models.CharField(
        max_length=100,
        blank=True,
    )

    vehicle_model = models.CharField(
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

    vehicle_chassis_number = models.CharField(
        max_length=100,
        blank=True,
    )

    vehicle_engine_number = models.CharField(
        max_length=100,
        blank=True,
    )

    vehicle_mileage = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    quantity = models.PositiveIntegerField(
        default=1,
        editable=False,
    )

    unit = models.CharField(
        max_length=30,
        default="Car",
        editable=False,
    )

    buyer_name = models.CharField(
        max_length=255,
        blank=True,
    )

    buyer_signature = models.TextField(
        blank=True,
    )

    buyer_signature_date = models.DateField(
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="delivery_notes",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "delivery_note_records"
        ordering = ["-created_at"]

    def __str__(self):
        return self.delivery_note_number