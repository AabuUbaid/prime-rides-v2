from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class Progression(models.Model):
    class SourceType(models.TextChoices):
        FINANCE = "finance", "Finance"
        CASH = "cash", "Cash"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        BLOCKED = "blocked", "Blocked"
        COMPLETED = "completed", "Completed"

    class Stage(models.TextChoices):
        EVALUATION = "evaluation", "Evaluation"
        PASSING = "passing", "Passing"
        DUBAI_PASSING = "dubai_passing", "Dubai Passing"
        REGISTRATION_PASSING = (
            "registration_passing",
            "Registration Emirate Passing",
        )
        INSURANCE = "insurance", "Insurance"
        REGISTRATION = "registration", "Registration"
        DELIVERY_VIDEO = "delivery_video", "Delivery Video"
        COMPLETED = "completed", "Completed"

    class RegistrationEmirate(models.TextChoices):
        DUBAI = "Dubai", "Dubai"
        ABU_DHABI = "Abu Dhabi", "Abu Dhabi"
        SHARJAH = "Sharjah", "Sharjah"
        AJMAN = "Ajman", "Ajman"
        FUJAIRAH = "Fujairah", "Fujairah"
        RAS_AL_KHAIMAH = (
            "Ras Al Khaimah",
            "Ras Al Khaimah",
        )
        UMM_AL_QUWAIN = (
            "Umm Al Quwain",
            "Umm Al Quwain",
        )

    quote = models.OneToOneField(
        "quotes.Quote",
        on_delete=models.PROTECT,
        related_name="progression",
    )

    source_type = models.CharField(
        max_length=20,
        choices=SourceType.choices,
    )

    bank_loan = models.ForeignKey(
        "finance.BankLoan",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="progressions",
    )

    cash_deal = models.ForeignKey(
        "finance.CashDeal",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="progressions",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    current_stage = models.CharField(
        max_length=40,
        choices=Stage.choices,
        default=Stage.EVALUATION,
    )

    registration_emirate = models.CharField(
        max_length=30,
        choices=RegistrationEmirate.choices,
        null=True,
        blank=True,
    )

    remark = models.TextField(
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="created_progressions",
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "progressions"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["current_stage"]),
            models.Index(fields=["source_type"]),
            models.Index(fields=["registration_emirate"]),
            models.Index(fields=["created_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(
                        source_type="finance",
                        bank_loan__isnull=False,
                        cash_deal__isnull=True,
                    )
                    |
                    Q(
                        source_type="cash",
                        bank_loan__isnull=True,
                        cash_deal__isnull=False,
                    )
                ),
                name="progression_valid_source_links",
            ),
        ]

    def clean(self):
        if self.source_type == self.SourceType.FINANCE:
            if not self.bank_loan_id or self.cash_deal_id:
                raise ValidationError(
                    "Finance Progression must have a Bank Loan only."
                )

        if self.source_type == self.SourceType.CASH:
            if not self.cash_deal_id or self.bank_loan_id:
                raise ValidationError(
                    "Cash Progression must have a Cash Deal only."
                )

    def __str__(self):
        return (
            f"Progression #{self.pk} - "
            f"Quote #{self.quote_id} - "
            f"{self.current_stage}"
        )
        
class ProgressionOverrideAudit(models.Model):
    progression = models.ForeignKey(
        "progression.Progression",
        on_delete=models.PROTECT,
        related_name="override_audits",
    )

    quote = models.ForeignKey(
        "quotes.Quote",
        on_delete=models.PROTECT,
        related_name="progression_override_audits",
    )

    acted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="progression_override_audits",
    )

    action = models.CharField(
        max_length=100,
    )

    reason = models.TextField()

    previous_status = models.CharField(
        max_length=30,
    )

    new_status = models.CharField(
        max_length=30,
    )

    previous_stage = models.CharField(
        max_length=50,
    )

    new_stage = models.CharField(
        max_length=50,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "progression_override_audits"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["progression", "created_at"],
            ),
            models.Index(
                fields=["quote", "created_at"],
            ),
        ]