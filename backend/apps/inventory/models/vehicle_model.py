from django.db import models

from .base import LookupModel
from .manufacturer import Manufacturer


class VehicleModel(LookupModel):
    manufacturer = models.ForeignKey(
        Manufacturer,
        on_delete=models.PROTECT,
        related_name="vehicle_models",
    )

    class Meta:
        db_table = "inventory_vehicle_models"
        verbose_name = "Vehicle Model"
        verbose_name_plural = "Vehicle Models"

        constraints = [
            models.UniqueConstraint(
                fields=["manufacturer", "name"],
                name="unique_manufacturer_vehicle_model",
            )
        ]

    def __str__(self):
        return f"{self.manufacturer.name} {self.name}"