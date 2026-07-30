from django.db import models

from apps.common.models import BaseModel


class LookupModel(BaseModel):
    """
    Abstract base model for inventory master data.

    Examples:
        - Manufacturer
        - Fuel Type
        - Transmission
        - Body Type
        - Vehicle Status
    """

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Immutable system identifier (e.g. AVAILABLE, DIESEL, SUV).",
    )

    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Human-readable display name.",
    )

    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Controls display order in dropdowns and admin.",
    )

    class Meta:
        abstract = True
        ordering = ("display_order", "name")

    def __str__(self):
        return self.name