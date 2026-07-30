from .base import LookupModel


class Manufacturer(LookupModel):

    class Meta:
        db_table = "inventory_manufacturers"
        verbose_name = "Manufacturer"
        verbose_name_plural = "Manufacturers"