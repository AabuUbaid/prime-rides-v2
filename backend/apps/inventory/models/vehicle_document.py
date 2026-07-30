from __future__ import annotations

from django.db import models

from apps.common.models import AuditModel


class VehicleDocumentType(models.TextChoices):
    REGISTRATION = "REGISTRATION", "Registration"
    INSURANCE = "INSURANCE", "Insurance"
    SERVICE_RECORD = "SERVICE_RECORD", "Service Record"
    INSPECTION = "INSPECTION", "Inspection"
    OTHER = "OTHER", "Other"


def vehicle_document_upload_path(
    instance: "VehicleDocument",
    filename: str,
) -> str:
    stock_number = instance.vehicle.stock_number or "unassigned"
    return f"inventory/vehicles/{stock_number}/documents/{filename}"


class VehicleDocument(AuditModel):
    vehicle = models.ForeignKey(
        "inventory.Vehicle",
        on_delete=models.CASCADE,
        related_name="documents",
    )

    document = models.FileField(
        upload_to=vehicle_document_upload_path,
    )

    document_type = models.CharField(
        max_length=30,
        choices=VehicleDocumentType.choices,
        default=VehicleDocumentType.OTHER,
    )

    title = models.CharField(
        max_length=150,
    )

    expires_on = models.DateField(
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "inventory_vehicle_documents"
        ordering = ("document_type", "title")

    def __str__(self):
        return f"{self.vehicle.stock_number} - {self.title}"
