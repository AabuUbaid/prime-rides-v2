from rest_framework import serializers


class LedgerSummarySerializer(serializers.Serializer):
    total_income = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
    )

    company_on_behalf = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
    )

    car_expenses = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
    )

    quote_expenses = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
    )

    emi_expenses = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
    )

    total_expense = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
    )

    ledger_net = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
    )

    stock_profit = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
    )