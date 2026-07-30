from django.db import models


class StockSequence(models.Model):
    current_value = models.PositiveBigIntegerField(default=0)

    class Meta:
        db_table = "inventory_stock_sequence"

    def __str__(self):
        return str(self.current_value)