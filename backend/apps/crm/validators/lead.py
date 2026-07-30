from django.core.exceptions import ValidationError


def validate_lead_budget(*, budget_min, budget_max) -> None:
    if budget_min is None or budget_max is None:
        return

    if budget_min < 0 or budget_max < 0:
        raise ValidationError({"budget": "Budget values cannot be negative."})

    if budget_min > budget_max:
        raise ValidationError(
            {"budget_max": "Maximum budget cannot be lower than minimum budget."}
        )
