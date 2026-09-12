from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Staff(models.Model):
    class JobRole(models.TextChoices):
        SALES_EXECUTIVE = "SALES_EXECUTIVE", "Sales Executive"
        PROCUREMENT = "PROCUREMENT", "Procurement"
        ACCOUNTS = "ACCOUNTS", "Accounts"
        ADMIN = "ADMIN", "Admin"
        MANAGER = "MANAGER", "Manager"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"

    id = models.BigAutoField(primary_key=True)

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_profile",
    )

    name = models.CharField(max_length=255)

    phone = models.CharField(
        max_length=30,
        blank=True,
    )

    join_date = models.DateField(
        null=True,
        blank=True,
    )

    job_role = models.CharField(
        max_length=30,
        choices=JobRole.choices,
    )

    base_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )

    visa_expiry = models.DateField(
        null=True,
        blank=True,
    )

    leave_balance = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )

    notes = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "staff"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["job_role"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return self.name