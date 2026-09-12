from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Lead(models.Model):
    class Source(models.TextChoices):
        DIRECT = "Direct", "Direct"
        DUBIZZLE = "Dubizzle", "Dubizzle"
        DUBIZZLE_IMPORT = "Dubizzle (Import)", "Dubizzle (Import)"
        FACEBOOK = "Facebook", "Facebook"
        GOOGLE_ADS = "Google Ads", "Google Ads"
        IMPORT = "Import", "Import"
        INSTAGRAM = "Instagram", "Instagram"
        INSURANCE = "Insurance", "Insurance"
        INTERAKT = "Interakt", "Interakt"
        REFERRAL = "Referral", "Referral"
        WEBSITE = "Website", "Website"
        WHATSAPP = "WhatsApp", "WhatsApp"

    class Status(models.TextChoices):
        NEW = "New", "New"
        CONTACTED = "Contacted", "Contacted"
        CASH_DEAL = "Cash Deal", "Cash Deal"
        FOLLOW_UP_NEGOTIATION = (
            "Follow-Up / Negotiation",
            "Follow-Up / Negotiation",
        )
        TEST_DRIVE_BOOKED = (
            "Test Drive Booked",
            "Test Drive Booked",
        )
        QUALIFIED = "Qualified", "Qualified"
        FOUR_K_LESS = "4k Less", "4k Less"
        BELOW_20K_BUDGET = (
            "Below 20k Budget",
            "Below 20k Budget",
        )
        UNQUALIFIED = "Unqualified", "Unqualified"

    phone_number = models.CharField(
        max_length=30,
    )

    customer_name = models.CharField(
        max_length=255,
        blank=True,
    )

    email = models.EmailField(
        blank=True,
    )

    enquiry_source = models.CharField(
        max_length=50,
        choices=Source.choices,
    )

    enquiry_status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.NEW,
    )

    assigned_to = models.ForeignKey(
        "staff.Staff",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_leads",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_leads",
    )

    purpose = models.CharField(
        max_length=255,
        blank=True,
    )

    notes = models.TextField(
        blank=True,
    )

    insurance = models.CharField(
        max_length=255,
        blank=True,
    )

    type_of_car = models.CharField(
        max_length=100,
        blank=True,
    )

    brand = models.CharField(
        max_length=100,
        blank=True,
    )

    mode_of_payment = models.CharField(
        max_length=100,
        blank=True,
    )

    salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
        ],
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True,
    )

    lead_from = models.CharField(
        max_length=255,
        blank=True,
    )

    last_activity_at = models.DateTimeField(
        default=timezone.now,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "leads"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(
                fields=["enquiry_status"],
            ),
            models.Index(
                fields=["enquiry_source"],
            ),
            models.Index(
                fields=["assigned_to"],
            ),
            models.Index(
                fields=["created_by"],
            ),
            models.Index(
                fields=["last_activity_at"],
            ),
            models.Index(
                fields=["phone_number"],
            ),
        ]

    def __str__(self):
        if self.customer_name:
            return f"{self.customer_name} - {self.phone_number}"

        return self.phone_number


class LeadActivity(models.Model):
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name="activities",
    )

    note = models.TextField(
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="lead_activities",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "lead_activities"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["lead", "-created_at"],
            ),
            models.Index(
                fields=["created_by"],
            ),
        ]

    def __str__(self):
        return f"Activity #{self.pk} - Lead #{self.lead_id}"


class LeadAssignmentHistory(models.Model):
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name="assignment_history",
    )

    previous_staff = models.ForeignKey(
        "staff.Staff",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    new_staff = models.ForeignKey(
        "staff.Staff",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="lead_assignment_changes",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "lead_assignment_history"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["lead", "-created_at"],
            ),
        ]

    def __str__(self):
        return f"Assignment #{self.pk} - Lead #{self.lead_id}"