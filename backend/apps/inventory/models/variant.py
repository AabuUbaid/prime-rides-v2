from django.db import models

from .base import LookupModel
from .generation import Generation


class Variant(LookupModel):
    generation = models.ForeignKey(
        Generation,
        on_delete=models.PROTECT,
        related_name="variants",
    )

    class Meta:
        db_table = "inventory_variants"

        constraints = [
            models.UniqueConstraint(
                fields=["generation", "name"],
                name="unique_generation_variant",
            )
        ]

    def __str__(self):
        return f"{self.generation} - {self.name}"