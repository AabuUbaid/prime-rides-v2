from django.conf import settings
from django.db import models


class Customer(models.Model):
    customer_name = models.CharField(
        max_length=255,
    )

    phone_number = models.CharField(
        max_length=30,
        unique=True,
    )

    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customers",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "customers"
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["customer_name"],
            ),
            models.Index(
                fields=["phone_number"],
            ),
            models.Index(
                fields=["created_at"],
            ),
        ]

    def __str__(self):
        return (
            f"{self.customer_name} - "
            f"{self.phone_number}"
        )


class CustomerDocument(models.Model):
    class Category(models.TextChoices):
        DRIVING_LICENSE = (
            "driving_license",
            "Driving License",
        )
        EMIRATES_ID = (
            "emirates_id",
            "Emirates ID",
        )
        BANK_LPO = (
            "bank_lpo",
            "Bank LPO",
        )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    category = models.CharField(
        max_length=30,
        choices=Category.choices,
    )

    document = models.FileField(
        upload_to="customer_documents/",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "customer_documents"
        ordering = ["category", "id"]

        indexes = [
            models.Index(
                fields=["customer", "category"],
            ),
            models.Index(
                fields=["category"],
            ),
        ]

    def __str__(self):
        return (
            f"{self.customer.customer_name} - "
            f"{self.get_category_display()}"
        )