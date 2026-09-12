from django.conf import settings
from django.db import models


class Insurance(models.Model):
    class ApplicationStatus(models.TextChoices):
        APPLIED = "applied", "Applied"
        DOCUMENTS_PENDING = "documents_pending", "Documents Pending"
        APPROVED = "approved", "Approved"

    # -------------------------------------------------
    # Source transaction
    # -------------------------------------------------

    quote = models.OneToOneField(
        "quotes.Quote",
        on_delete=models.PROTECT,
        related_name="insurance",
    )

    bank_loan = models.OneToOneField(
        "finance.BankLoan",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="insurance",
    )

    cash_deal = models.OneToOneField(
        "finance.CashDeal",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="insurance",
    )

    # -------------------------------------------------
    # Customer snapshot
    # -------------------------------------------------

    customer_name = models.CharField(
        max_length=255,
    )

    customer_mobile = models.CharField(
        max_length=30,
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

    # -------------------------------------------------
    # Payment source
    # -------------------------------------------------

    payment_method = models.CharField(
        max_length=30,
    )

    # -------------------------------------------------
    # Insurance workflow
    # -------------------------------------------------

    application_status = models.CharField(
        max_length=30,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.APPLIED,
    )
    class RenewalStatus(models.TextChoices):
        INFORMED_CUSTOMER = (
            "informed_customer",
            "Informed Customer",
        )
        APPLIED_NEW = (
            "applied_new",
            "Applied New",
        )
        FOLLOW_UP = (
            "follow_up",
            "Follow Up",
        )
        NOT_INTERESTED = (
            "not_interested",
            "Not Interested",
        )
        NEW_INSURANCE_APPROVED = (
            "new_insurance_approved",
            "New Insurance Approved",
        )

    policy_number = models.CharField(
        max_length=100,
        blank=True,
    )

    expiry_date = models.DateField(
        null=True,
        blank=True,
    )

    remark = models.TextField(
        blank=True,
    )
    renewal_status = models.CharField(
        max_length=40,
        choices=RenewalStatus.choices,
        null=True,
        blank=True,
    )

    # -------------------------------------------------
    # Audit
    # -------------------------------------------------

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="insurance_records",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "insurance_records"
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"Insurance - "
            f"{self.vehicle_stock_id} - "
            f"{self.customer_name}"
        )
        
class InsurancePolicy(models.Model):
    insurance = models.ForeignKey(
        Insurance,
        on_delete=models.CASCADE,
        related_name="policy_cycles",
    )

    cycle_number = models.PositiveIntegerField()

    policy_number = models.CharField(
        max_length=100,
    )

    start_date = models.DateField()

    expiry_date = models.DateField()

    is_active = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "insurance_policy_cycles"
        ordering = ["cycle_number"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "insurance",
                    "cycle_number",
                ],
                name="unique_insurance_policy_cycle",
            ),
            models.UniqueConstraint(
                fields=[
                    "policy_number",
                ],
                name="unique_insurance_policy_number",
            ),
        ]

    def __str__(self):
        return (
            f"{self.policy_number} - "
            f"Cycle {self.cycle_number}"
        )