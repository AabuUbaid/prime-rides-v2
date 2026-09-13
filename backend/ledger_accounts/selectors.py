from finance.models import CashReceipt, EmiExpense
from inventory.models import CarExpense
from quotes.models import QuoteExpense
from progression.models import Progression


def get_customer_cash_receipts():
    """
    Actual customer money received.

    CashReceipt remains the authoritative source.
    """
    return CashReceipt.objects.filter(
        direction=CashReceipt.Direction.CUSTOMER_PAYMENT,
    )


def get_company_cash_receipts():
    """
    Actual company-on-behalf financial movements.

    CashReceipt remains the authoritative source for these
    recorded financial movements.
    """
    return CashReceipt.objects.filter(
        direction=CashReceipt.Direction.COMPANY_ON_BEHALF,
    )


def get_car_expenses():
    """
    Actual inventory/vehicle expenses.
    """
    return CarExpense.objects.all()


def get_quote_expenses():
    """
    Quote expenses that have an actual incurred amount.

    Estimated amounts are not ledger expenses.
    """
    return QuoteExpense.objects.filter(
        actual_amount__isnull=False,
        applies=True,
    )


def get_emi_expenses():
    """
    Actual EMI-related expenses.
    """
    return EmiExpense.objects.all()


def get_completed_progressions():
    """
    Completed vehicle sales used for official Stock Profit.
    """
    return (
        Progression.objects
        .filter(
            status=Progression.Status.COMPLETED,
        )
        .select_related(
            "quote",
            "quote__car",
        )
    )