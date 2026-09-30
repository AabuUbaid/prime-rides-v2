from django.db import models

import uuid
from django.conf import settings
from django.core.validators import FileExtensionValidator

class Company(models.Model):
    legal_entity_name = models.CharField(
        max_length=255,
    )

    trade_license_number = models.CharField(
        max_length=100,
        blank=True,
    )

    trade_license_expiry_date = models.DateField(
        blank=True,
        null=True,
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

    corporate_email = models.EmailField(
        max_length=254,
        blank=True,
    )

    official_phone = models.CharField(
        max_length=30,
        blank=True,
    )

    emirate = models.CharField(
        max_length=50,
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
    
    
class CompanyDocument(models.Model):
    company = models.ForeignKey(
        Company,
        on_delete=models.PROTECT,
        related_name="documents",
    )

    name = models.CharField(
        max_length=255,
    )

    file = models.FileField(
        upload_to="company/documents/",
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="uploaded_company_documents",
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "company_documents"
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["company"]),
            models.Index(fields=["uploaded_at"]),
        ]

    def __str__(self):
        return self.name