from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.common.models import AuditModel
from apps.crm.managers import LeadManager
from apps.crm.validators.lead import validate_lead_budget


class LeadSource(models.TextChoices):
    WALK_IN = "WALK_IN", "Walk In"
    WEBSITE = "WEBSITE", "Website"
    PHONE = "PHONE", "Phone"
    REFERRAL = "REFERRAL", "Referral"
    SOCIAL_MEDIA = "SOCIAL_MEDIA", "Social Media"
    MARKETPLACE = "MARKETPLACE", "Marketplace"
    OTHER = "OTHER", "Other"


class LeadStatus(models.TextChoices):
    NEW = "NEW", "New"
    CONTACTED = "CONTACTED", "Contacted"
    QUALIFIED = "QUALIFIED", "Qualified"
    QUOTED = "QUOTED", "Quoted"
    WON = "WON", "Won"
    LOST = "LOST", "Lost"


class LeadPriority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    URGENT = "URGENT", "Urgent"


class Lead(AuditModel):
    customer = models.ForeignKey(
        "crm.Customer",
        on_delete=models.PROTECT,
        related_name="leads",
    )

    interested_vehicle = models.ForeignKey(
        "inventory.Vehicle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leads",
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_leads",
    )

    source = models.CharField(
        max_length=30,
        choices=LeadSource.choices,
        default=LeadSource.WALK_IN,
        db_index=True,
    )

    status = models.CharField(
        max_length=20,
        choices=LeadStatus.choices,
        default=LeadStatus.NEW,
        db_index=True,
    )

    priority = models.CharField(
        max_length=20,
        choices=LeadPriority.choices,
        default=LeadPriority.MEDIUM,
        db_index=True,
    )

    budget_min = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    budget_max = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    expected_purchase_date = models.DateField(null=True, blank=True)
    trade_in_vehicle = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)
    lost_reason = models.TextField(blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)

    objects = LeadManager()

    class Meta:
        db_table = "crm_leads"
        ordering = ("-created_at",)

    def clean(self):
        validate_lead_budget(
            budget_min=self.budget_min,
            budget_max=self.budget_max,
        )

    def __str__(self):
        return f"{self.customer} - {self.status}"
