from __future__ import annotations

from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models

from apps.common.models import AuditModel
from apps.crm.managers import CustomerManager
from apps.crm.validators.customer import validate_customer_identity


phone_validator = RegexValidator(
    regex=r"^\+?[0-9]{8,15}$",
    message="Enter a valid phone number.",
)


class CustomerType(models.TextChoices):
    INDIVIDUAL = "INDIVIDUAL", "Individual"
    COMPANY = "COMPANY", "Company"


class ContactMethod(models.TextChoices):
    PHONE = "PHONE", "Phone"
    EMAIL = "EMAIL", "Email"
    WHATSAPP = "WHATSAPP", "WhatsApp"
    SMS = "SMS", "SMS"


class Customer(AuditModel):
    customer_type = models.CharField(
        max_length=20,
        choices=CustomerType.choices,
        default=CustomerType.INDIVIDUAL,
        db_index=True,
    )

    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    company_name = models.CharField(max_length=150, blank=True)

    email = models.EmailField(blank=True, db_index=True)
    phone_number = models.CharField(
        max_length=20,
        db_index=True,
        validators=[phone_validator],
    )
    alternate_phone_number = models.CharField(
        max_length=20,
        blank=True,
        validators=[phone_validator],
    )

    preferred_contact_method = models.CharField(
        max_length=20,
        choices=ContactMethod.choices,
        default=ContactMethod.PHONE,
    )

    tax_id = models.CharField(max_length=50, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    address_line_1 = models.CharField(max_length=150, blank=True)
    address_line_2 = models.CharField(max_length=150, blank=True)
    city = models.CharField(max_length=80, blank=True)
    state = models.CharField(max_length=80, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=80, blank=True)

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_customers",
    )

    notes = models.TextField(blank=True)

    objects = CustomerManager()

    class Meta:
        db_table = "crm_customers"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=("phone_number",),
                name="unique_customer_phone_number",
            )
        ]

    def clean(self):
        validate_customer_identity(
            customer_type=self.customer_type,
            first_name=self.first_name,
            company_name=self.company_name,
            email=self.email,
            phone_number=self.phone_number,
        )

    @property
    def display_name(self) -> str:
        if self.customer_type == CustomerType.COMPANY:
            return self.company_name
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return self.display_name or self.phone_number
