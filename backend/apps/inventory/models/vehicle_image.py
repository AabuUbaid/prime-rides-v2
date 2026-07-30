from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.common.models import AuditModel


def vehicle_image_upload_path(instance: "VehicleImage", filename: str) -> str:
    stock_number = instance.vehicle.stock_number or "unassigned"
    return f"inventory/vehicles/{stock_number}/images/{filename}"


class VehicleImage(AuditModel):
    vehicle = models.ForeignKey(
        "inventory.Vehicle",
        on_delete=models.CASCADE,
        related_name="images",
    )

    image = models.ImageField(
        upload_to=vehicle_image_upload_path,
    )

    alt_text = models.CharField(
        max_length=150,
        blank=True,
    )

    display_order = models.PositiveIntegerField(
        default=0,
    )

    is_primary = models.BooleanField(
        default=False,
        db_index=True,
    )

    class Meta:
        db_table = "inventory_vehicle_images"
        ordering = ("display_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=("vehicle",),
                condition=Q(is_primary=True, is_active=True),
                name="unique_active_primary_vehicle_image",
            )
        ]

    def clean(self):
        if not self.is_primary or not self.vehicle_id:
            return

        existing_primary = VehicleImage.all_objects.filter(
            vehicle_id=self.vehicle_id,
            is_primary=True,
            is_active=True,
        )

        if self.pk:
            existing_primary = existing_primary.exclude(pk=self.pk)

        if existing_primary.exists():
            raise ValidationError(
                {"is_primary": "A vehicle can only have one primary image."}
            )

    def __str__(self):
        return f"{self.vehicle.stock_number} image"
