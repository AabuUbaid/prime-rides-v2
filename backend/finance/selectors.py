from .models import Bank


def list_banks(
    *,
    active_only=False,
):
    """
    Return banks ordered by name.
    """

    queryset = Bank.objects.all()

    if active_only:
        queryset = queryset.filter(
            is_active=True
        )

    return queryset.order_by("name")


def get_bank(
    bank_id,
):
    """
    Return a single bank by ID.

    Raises:
        Bank.DoesNotExist
    """

    return Bank.objects.get(
        pk=bank_id
    )


def get_active_bank(
    bank_id,
):
    """
    Return an active bank.

    Raises:
        Bank.DoesNotExist
    """

    return Bank.objects.get(
        pk=bank_id,
        is_active=True,
    )