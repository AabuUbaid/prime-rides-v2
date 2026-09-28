
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.conf import settings
import uuid

class RTARecord(models.Model):
    class RecordType(models.TextChoices):
        PURCHASE = "PURCHASE", "Purchase"
        SALE = "SALE", "Sale"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        GENERATED = "GENERATED", "Generated"
        SIGNED = "SIGNED", "Signed"
        SUBMITTED = "SUBMITTED", "Submitted"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    class PartyRole(models.TextChoices):
        COMPANY = "COMPANY", "Company"
        CUSTOMER = "CUSTOMER", "Customer"
        SUPPLIER = "SUPPLIER", "Supplier"
        OTHER = "OTHER", "Other"

    # -------------------------------------------------
    # RTA record information
    # -------------------------------------------------

    record_type = models.CharField(
        max_length=20,
        choices=RecordType.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    rta_date = models.DateField(
        default=timezone.localdate,
    )

    # -------------------------------------------------
    # Existing system relationships
    # -------------------------------------------------

    quote = models.ForeignKey(
        "quotes.Quote",
        on_delete=models.PROTECT,
        related_name="rta_records",
        null=True,
        blank=True,
    )

    car = models.ForeignKey(
        "inventory.Car",
        on_delete=models.PROTECT,
        related_name="rta_records",
    )

    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="rta_records",
        null=True,
        blank=True,
    )

    company = models.ForeignKey(
        "company.Company",
        on_delete=models.PROTECT,
        related_name="rta_records",
    )

    branch = models.ForeignKey(
        "company.CompanyBranch",
        on_delete=models.PROTECT,
        related_name="rta_records",
        null=True,
        blank=True,
    )

    # -------------------------------------------------
    # First party
    # -------------------------------------------------

    first_party_name = models.CharField(
        max_length=255,
    )

    first_party_role = models.CharField(
        max_length=20,
        choices=PartyRole.choices,
    )

    # -------------------------------------------------
    # Second party
    # -------------------------------------------------

    second_party_name = models.CharField(
        max_length=255,
    )

    second_party_role = models.CharField(
        max_length=20,
        choices=PartyRole.choices,
    )

    second_party_mobile = models.CharField(
        max_length=30,
        blank=True,
    )

    # -------------------------------------------------
    # Purchase supplier information
    # -------------------------------------------------

    supplier_name = models.CharField(
        max_length=255,
        blank=True,
    )

    supplier_mobile = models.CharField(
        max_length=30,
        blank=True,
    )

    supplier_address = models.TextField(
        blank=True,
    )

    supplier_trade_license_number = models.CharField(
        max_length=100,
        blank=True,
    )

    # -------------------------------------------------
    # RTA-specific editable information
    # -------------------------------------------------

    rta_reference_number = models.CharField(
        max_length=100,
        blank=True,
    )

    first_party_signatory_name = models.CharField(
        max_length=255,
        blank=True,
    )

    second_party_signatory_name = models.CharField(
        max_length=255,
        blank=True,
    )

    notes = models.TextField(
        blank=True,
    )
    # -------------------------------------------------
    # Company snapshot
    # -------------------------------------------------

    company_legal_name = models.CharField(
        max_length=255,
    )

    trade_license_number = models.CharField(
        max_length=100,
        blank=True,
    )

    company_address = models.TextField(
        blank=True,
    )

    # -------------------------------------------------
    # Vehicle snapshot
    # -------------------------------------------------

    vehicle_stock_id = models.CharField(
        max_length=50,
        blank=True,
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

    vehicle_type = models.CharField(
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

    vehicle_country_of_manufacture = models.CharField(
        max_length=100,
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
    # Historical source snapshot
    # -------------------------------------------------

    snapshot_data = models.JSONField(
        default=dict,
        blank=True,
    )

    # -------------------------------------------------
    # Audit timestamps
    # -------------------------------------------------

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "rta_records"
        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["record_type"]),
            models.Index(fields=["status"]),
            models.Index(fields=["rta_date"]),
            models.Index(fields=["quote"]),
            models.Index(fields=["car"]),
            models.Index(fields=["customer"]),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["quote", "record_type"],
                condition=Q(
                    record_type="SALE",
                    quote__isnull=False,
                ),
                name="unique_sale_rta_per_quote",
            ),
            models.UniqueConstraint(
                fields=["car", "record_type"],
                condition=Q(
                    record_type="PURCHASE",
                ),
                name="unique_purchase_rta_per_car",
            ),
        ]
        
    @classmethod
    def allowed_status_transitions(cls):
            return {
                cls.Status.DRAFT: {
                    cls.Status.GENERATED,
                    cls.Status.CANCELLED,
                },
                cls.Status.GENERATED: {
                    cls.Status.SIGNED,
                    cls.Status.CANCELLED,
                },
                cls.Status.SIGNED: {
                    cls.Status.SUBMITTED,
                    cls.Status.CANCELLED,
                },
                cls.Status.SUBMITTED: {
                    cls.Status.COMPLETED,
                    cls.Status.CANCELLED,
                },
                cls.Status.COMPLETED: set(),
                cls.Status.CANCELLED: set(),
            }

    def __str__(self):
        reference = (
            f"Quote {self.quote_id}"
            if self.quote_id
            else f"Vehicle {self.car_id}"
        )

        vehicle_reference = (
            self.vehicle_stock_id
            or self.vehicle_chassis_number
            or self.car_id
        )

        return (
            f"{self.record_type} - "
            f"{reference} - "
            f"{vehicle_reference}"
        )
        
        
class RTADocument(models.Model):
    class DocumentType(models.TextChoices):
        SUPPLIER_DOCUMENT = (
            "SUPPLIER_DOCUMENT",
            "Supplier Document",
        )
        PURCHASE_AGREEMENT = (
            "PURCHASE_AGREEMENT",
            "Purchase Agreement",
        )
        SALE_AGREEMENT = (
            "SALE_AGREEMENT",
            "Sale Agreement",
        )
        OTHER = (
            "OTHER",
            "Other",
        )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    rta_record = models.ForeignKey(
        RTARecord,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    document_type = models.CharField(
        max_length=40,
        choices=DocumentType.choices,
    )

    file = models.FileField(
        upload_to="rta_documents/",
    )

    original_filename = models.CharField(
        max_length=255,
    )

    mime_type = models.CharField(
        max_length=100,
        blank=True,
    )

    file_size = models.PositiveBigIntegerField(
        default=0,
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="uploaded_rta_documents",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "rta_documents"
        ordering = ["-created_at"]

    

    def __str__(self):
        return (
            f"{self.rta_record_id} - "
            f"{self.original_filename}"
        )