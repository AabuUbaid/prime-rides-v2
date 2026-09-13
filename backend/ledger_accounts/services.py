from decimal import Decimal

from django.db.models import (
    DecimalField,
    F,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce

from finance.models import CashReceipt, EmiExpense
from inventory.models import CarExpense
from quotes.models import QuoteExpense
from progression.models import Progression


ZERO = Decimal("0.00")


def _sum_amount(queryset, field_name):
    return queryset.aggregate(
        total=Coalesce(
            Sum(field_name),
            Value(ZERO),
            output_field=DecimalField(
                max_digits=14,
                decimal_places=2,
            ),
        )
    )["total"]


def get_total_income():
    """
    Total actual customer money received.

    CashReceipt is the authoritative income source.
    """

    return _sum_amount(
        CashReceipt.objects.filter(
            direction=CashReceipt.Direction.CUSTOMER_PAYMENT,
        ),
        "amount",
    )


def get_company_on_behalf_total():
    """
    Total actual company-on-behalf CashReceipt movements.
    """

    return _sum_amount(
        CashReceipt.objects.filter(
            direction=CashReceipt.Direction.COMPANY_ON_BEHALF,
        ),
        "amount",
    )


def get_car_expense_total():
    """
    Actual inventory/vehicle expenses.
    """

    return _sum_amount(
        CarExpense.objects.all(),
        "amount",
    )


def get_quote_expense_total():
    """
    Actual Quote expenses only.

    Estimated min/max values are deliberately excluded.
    """

    return _sum_amount(
        QuoteExpense.objects.filter(
            actual_amount__isnull=False,
            applies=True,
        ),
        "actual_amount",
    )


def get_emi_expense_total():
    """
    Actual EMI expenses.
    """

    return _sum_amount(
        EmiExpense.objects.all(),
        "amount",
    )


def get_total_expense():
    """
    Total expense represented by the existing financial
    architecture.

    This stage reports each existing expense source separately
    so that double counting can be identified before combining
    them into the final Ledger Net calculation.
    """

    company_on_behalf = get_company_on_behalf_total()
    car_expenses = get_car_expense_total()
    quote_expenses = get_quote_expense_total()
    emi_expenses = get_emi_expense_total()

    return (
        company_on_behalf
        + car_expenses
        + quote_expenses
        + emi_expenses
    )


def get_ledger_net():
    """
    Ledger Net = Total Income - Total Expense.
    """

    return (
        get_total_income()
        - get_total_expense()
    )


def get_stock_profit():
    """
    Official Stock Profit.

    Only completed vehicle sales are included.

    Stock Profit =
        Selling Price - Purchase Cost

    Vehicle/finance expenses are not deducted here.
    """

    completed_progressions = (
        Progression.objects
        .filter(
            status=Progression.Status.COMPLETED,
        )
        .select_related(
            "quote",
            "quote__car",
        )
    )

    return completed_progressions.annotate(
        stock_profit=(
            F("quote__price")
            - F("quote__car__purchase_cost")
        )
    ).aggregate(
        total=Coalesce(
            Sum("stock_profit"),
            Value(ZERO),
            output_field=DecimalField(
                max_digits=14,
                decimal_places=2,
            ),
        )
    )["total"]


def get_ledger_summary():
    """
    Stage 2 Ledger Accounts summary.
    """

    total_income = get_total_income()
    company_on_behalf = get_company_on_behalf_total()
    car_expenses = get_car_expense_total()
    quote_expenses = get_quote_expense_total()
    emi_expenses = get_emi_expense_total()

    total_expense = (
        company_on_behalf
        + car_expenses
        + quote_expenses
        + emi_expenses
    )

    ledger_net = total_income - total_expense
    stock_profit = get_stock_profit()

    return {
        "total_income": total_income,
        "company_on_behalf": company_on_behalf,
        "car_expenses": car_expenses,
        "quote_expenses": quote_expenses,
        "emi_expenses": emi_expenses,
        "total_expense": total_expense,
        "ledger_net": ledger_net,
        "stock_profit": stock_profit,
    }