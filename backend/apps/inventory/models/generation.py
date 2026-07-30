from django.db import models

from .base import LookupModel
from .vehicle_model import VehicleModel


class Generation(LookupModel):
    vehicle_model = models.ForeignKey(
        VehicleModel,
        on_delete=models.PROTECT,
        related_name="generations",
    )

    code = models.CharField(
        max_length=50,
        help_text="Example: E210, XV70, Y62",
    )

    production_start_year = models.PositiveSmallIntegerField()

    production_end_year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "inventory_generations"

        constraints = [
            models.UniqueConstraint(
                fields=["vehicle_model", "code"],
                name="unique_generation_code",
            )
        ]

    def __str__(self):
        return (
            f"{self.vehicle_model} "
            f"{self.code} "
            f"({self.production_start_year}"
            f"-{self.production_end_year or 'Present'})"
        )