from django.db import transaction

from apps.inventory.models.stock_sequence import StockSequence


class StockNumberService:
    """
    Generates sequential stock numbers.

    Example:
        PR-000001
        PR-000002
        PR-000003
    """

    PREFIX = "PR"
    PADDING = 6

    @classmethod
    @transaction.atomic
    def generate(cls) -> str:
        sequence, _ = StockSequence.objects.select_for_update().get_or_create(
            pk=1,
            defaults={"current_value": 0},
        )

        sequence.current_value += 1
        sequence.save(update_fields=["current_value"])

        return (
            f"{cls.PREFIX}-"
            f"{sequence.current_value:0{cls.PADDING}d}"
        )