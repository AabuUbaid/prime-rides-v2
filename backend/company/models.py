from django.db import models


class Company(models.Model):
    legal_entity_name = models.CharField(
        max_length=255,
    )

    tax_registration_number = models.CharField(
        max_length=100,
        blank=True,
    )

    showroom_address = models.TextField(
        blank=True,
    )

    main_contact_mobile = models.CharField(
        max_length=30,
        blank=True,
    )

    default_currency = models.CharField(
        max_length=10,
        default="AED",
    )

    default_regional_spec = models.CharField(
        max_length=100,
        default="GCC Specs (Standard)",
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "companies"
        ordering = ["-created_at"]

    def __str__(self):
        return self.legal_entity_name


class CompanyBranch(models.Model):
    company = models.ForeignKey(
        Company,
        on_delete=models.PROTECT,
        related_name="branches",
    )

    name = models.CharField(
        max_length=255,
    )

    address = models.TextField(
        blank=True,
    )

    contact_mobile = models.CharField(
        max_length=30,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "company_branches"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["company"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.company.legal_entity_name} - {self.name}"