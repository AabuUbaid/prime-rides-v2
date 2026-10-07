from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from quotes.models import Quote
from inventory.models import (
    Car,
    SpecialPriceRequest,
)
from inventory.services import InventoryService

from customers.models import Customer
from .models import (
    Bank,
    BankProcessingConfiguration,
    EmiExpense,
    EmiSequence,
    EmiSheet,
    ExpensePreset,
    InsuranceBand,
    ServicePackage,
    BankLoan,
    BankLoanFollowUp,
    CashDeal,
    BalanceSheet
)

from .selectors import (
    get_active_bank,
    get_active_bank_processing_configuration,
    get_active_expense_preset_by_type,
    get_active_evaluation_preset,
    get_active_registration_preset,
    get_active_rta_preset,
    get_insurance_band_for_vehicle_price,
    get_active_service_package,

)

ZERO = Decimal("0.00")
VAT_RATE = Decimal("0.05")
MINIMUM_VEHICLE_PRICE = Decimal("20000.00")
MAX_TENURE_YEARS = 5


# =========================================================
# INTERNAL HELPERS
# =========================================================


def _money(value):
    """
    Normalize a Decimal monetary value to two decimal places.
    """
    if value is None:
        return ZERO

    return Decimal(value).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def _decimal(value):
    """
    Convert a value safely to Decimal.
    """
    if value is None:
        return ZERO

    if isinstance(value, Decimal):
        return value

    return Decimal(str(value))


def _raise_validation(message, field=None):
    """
    Raise Django ValidationError in the format expected by
    the existing Finance views.
    """
    if field:
        raise DjangoValidationError(
            {
                field: message,
            }
        )

    raise DjangoValidationError(message)


def _validate_financial_inputs(
    *,
    vehicle_price,
    down_payment,
    tenure_years,
    vat_enabled=False,
):
    """
    Server-side validation shared by calculation and save.
    """

    vehicle_price = _decimal(vehicle_price)
    down_payment = _decimal(down_payment)

    if vehicle_price < MINIMUM_VEHICLE_PRICE:
        _raise_validation(
            "Vehicle price must be at least AED 20,000.",
            field="vehicle_price",
        )

    if tenure_years is None:
        tenure_years = 5

    try:
        tenure_years = int(tenure_years)
    except (TypeError, ValueError):
        _raise_validation(
            "Tenure must be a valid number of years.",
            field="tenure_years",
        )

    if tenure_years < 1:
        _raise_validation(
            "Tenure must be at least 1 year.",
            field="tenure_years",
        )

    if tenure_years > MAX_TENURE_YEARS:
        _raise_validation(
            "Tenure cannot exceed 5 years.",
            field="tenure_years",
        )

    vat_amount = _money(
        vehicle_price * VAT_RATE
    )

    applicable_price = _money(
        vehicle_price + vat_amount
    )

    if down_payment < ZERO:
        _raise_validation(
            "Down payment cannot be negative.",
            field="down_payment",
        )

    if down_payment > applicable_price:
        _raise_validation(
            "Down payment cannot exceed applicable "
            "vehicle price.",
            field="down_payment",
        )

    return {
        "vehicle_price": _money(vehicle_price),
        "down_payment": _money(down_payment),
        "tenure_years": tenure_years,
        "vat_amount": vat_amount,
        "price_after_vat": applicable_price,
    }


# =========================================================
# BANK SERVICES
# =========================================================


def create_bank(
    *,
    name,
    interest_rate,
    is_cash=False,
    is_active=True,
):
    """
    Create a bank.

    Cash banks are always forced to 0% interest.
    """

    name = (name or "").strip()

    if not name:
        _raise_validation(
            "Bank name is required.",
            field="name",
        )

    interest_rate = _decimal(interest_rate)

    if interest_rate < ZERO:
        _raise_validation(
            "Interest rate cannot be negative.",
            field="interest_rate",
        )

    if is_cash:
        interest_rate = ZERO

    return Bank.objects.create(
        name=name,
        interest_rate=_money(interest_rate),
        is_cash=is_cash,
        is_active=is_active,
    )


def update_bank(
    *,
    bank,
    name=None,
    interest_rate=None,
    is_cash=None,
    is_active=None,
):
    """
    Update a bank while preserving the Cash = 0% rule.
    """

    if name is not None:
        name = name.strip()

        if not name:
            _raise_validation(
                "Bank name is required.",
                field="name",
            )

        bank.name = name

    if is_cash is not None:
        bank.is_cash = is_cash

    if interest_rate is not None:
        interest_rate = _decimal(
            interest_rate
        )

        if interest_rate < ZERO:
            _raise_validation(
                "Interest rate cannot be negative.",
                field="interest_rate",
            )

        bank.interest_rate = interest_rate

    if bank.is_cash:
        bank.interest_rate = ZERO

    if is_active is not None:
        bank.is_active = is_active

    bank.save()

    return bank


# =========================================================
# BANK RESOLUTION
# =========================================================


def resolve_bank_interest_rate(bank):
    """
    Resolve the authoritative interest rate for a bank.

    Cash banks always resolve to 0%.
    """

    if bank.is_cash:
        return ZERO

    return _money(bank.interest_rate)


def resolve_active_bank(bank_id):
    """
    Resolve an active bank and its authoritative interest rate.

    Returns:
        tuple[Bank, Decimal]
    """

    try:
        bank = get_active_bank(bank_id)
    except Bank.DoesNotExist:
        _raise_validation(
            "Selected bank does not exist or is inactive.",
            field="bank_id",
        )

    interest_rate = resolve_bank_interest_rate(
        bank
    )

    return bank, interest_rate


# =========================================================
# EXPENSE PRESET RESOLUTION
# =========================================================


def resolve_expense_preset(
    *,
    expense_type,
):
    """
    Resolve the active Master-configured expense preset.

    Frontend-supplied amounts are never trusted.
    """

    preset = (
        get_active_expense_preset_by_type(
            expense_type
        )
    )

    if preset is None:
        raise DjangoValidationError(
            f"No active expense preset exists for "
            f"expense type '{expense_type}'."
        )

    return preset


def resolve_fixed_expense_amount(
    *,
    expense_type,
):
    """
    Resolve an active fixed expense.
    """

    preset = resolve_expense_preset(
        expense_type=expense_type,
    )

    if preset.calculation_type != "fixed":
        raise DjangoValidationError(
            f"Expense preset '{expense_type}' "
            "is not configured as a fixed expense."
        )

    return preset, _money(preset.amount)


# =========================================================
# SPECIFIC EXPENSE PRESETS
# =========================================================


def resolve_rta_passing():
    """
    Resolve the active RTA Passing preset.
    """

    preset = get_active_rta_preset()

    if preset is None:
        raise DjangoValidationError(
            "No active RTA Passing expense is configured."
        )

    return preset, _money(preset.amount)


def resolve_evaluation():
    """
    Resolve the authoritative Evaluation preset.

    The selector is responsible for selecting the configured
    evaluation preset rather than trusting frontend values.
    """

    preset = get_active_evaluation_preset()

    if preset is None:
        raise DjangoValidationError(
            "No active Evaluation expense is configured."
        )

    return preset, _money(preset.amount)


def resolve_registration(
    *,
    dubai_registration=False,
):
    """
    Resolve Dubai / Non-Dubai registration.
    """

    preset = get_active_registration_preset(
        dubai_registration=dubai_registration,
    )

    if preset is None:
        raise DjangoValidationError(
            "No active registration expense is configured "
            f"for dubai_registration="
            f"{dubai_registration}."
        )

    return preset, _money(preset.amount)


def resolve_registration_amount(
    *,
    dubai_registration,
):
    """
    Backward-compatible registration resolver.
    """

    return resolve_registration(
        dubai_registration=dubai_registration,
    )


# =========================================================
# INSURANCE
# =========================================================


def resolve_insurance(
    *,
    vehicle_price,
):
    """
    Resolve the active insurance band for the vehicle price.
    """

    band = get_insurance_band_for_vehicle_price(
        vehicle_price
    )

    if band is None:
        raise DjangoValidationError(
            "No active insurance band is configured "
            f"for vehicle price {vehicle_price}."
        )

    return band, _money(band.amount)


def resolve_insurance_amount(
    *,
    vehicle_price,
    driving_license=True,
):
    """
    Resolve insurance base amount and the no-license
    surcharge.
    """

    band, base_amount = resolve_insurance(
        vehicle_price=vehicle_price,
    )

    surcharge = (
        _money(band.no_license_surcharge)
        if not driving_license
        else ZERO
    )

    return {
        "band": band,
        "base_amount": _money(base_amount),
        "surcharge_amount": _money(surcharge),
        "total_amount": _money(
            base_amount + surcharge
        ),
    }


# =========================================================
# SERVICE PACKAGE
# =========================================================


def resolve_service_package(
    *,
    selected,
    service_package_id=None,
):
    """
    Resolve the specifically selected active Master-configured
    Service Package.

    The frontend sends only the package ID.
    The package name/amount always comes from the database.
    """

    if not selected:
        return {
            "package": None,
            "amount": ZERO,
        }

    if not service_package_id:
        raise DjangoValidationError(
            "A Service Package must be selected."
        )

    try:
        package = get_active_service_package(
            service_package_id
        )
    except ServicePackage.DoesNotExist:
        raise DjangoValidationError(
            "The selected Service Package is not active or does not exist."
        )

    return {
        "package": package,
        "amount": _money(package.amount),
    }
# =========================================================
# BANK PROCESSING
# =========================================================


def resolve_bank_processing_configuration(
    *,
    bank_id,
):
    """
    Resolve the active bank processing configuration.
    """

    try:
        configuration = (
            get_active_bank_processing_configuration(
                bank_id
            )
        )
    except BankProcessingConfiguration.DoesNotExist:
        raise DjangoValidationError(
            "No active bank processing configuration "
            f"exists for bank {bank_id}."
        )

    return configuration


def calculate_bank_processing_amount(
    *,
    vehicle_price,
    configuration,
):
    """
    Calculate:

        max(
            vehicle_price * percentage / 100,
            minimum_amount
        )
    """

    vehicle_price = _decimal(
        vehicle_price
    )

    percentage_amount = (
        vehicle_price
        * configuration.percentage
        / Decimal("100")
    )

    return _money(
        max(
            percentage_amount,
            configuration.minimum_amount,
        )
    )


def resolve_bank_processing_amount(
    *,
    bank_id,
    vehicle_price,
):
    """
    Resolve bank processing configuration and
    calculate the authoritative processing amount.
    """

    configuration = (
        resolve_bank_processing_configuration(
            bank_id=bank_id,
        )
    )

    amount = calculate_bank_processing_amount(
        vehicle_price=vehicle_price,
        configuration=configuration,
    )

    return {
        "configuration": configuration,
        "amount": amount,
    }


# =========================================================
# GENERIC FUTURE FIXED EXPENSE
# =========================================================


def resolve_future_expense(
    *,
    expense_type,
):
    """
    Resolve the newest active expense preset for the
    requested expense type.

    The calculation type is evaluated by the caller.
    """
    preset = (
        ExpensePreset.objects
        .filter(
            expense_type=expense_type,
            is_active=True,
        )
        .order_by("-id")
        .first()
    )

    if preset is None:
        raise ExpensePreset.DoesNotExist(
            f"No active expense configuration exists "
            f"for '{expense_type}'."
        )

    return preset


# =========================================================
# EXPENSE CONDITION RESOLUTION
# =========================================================


def _normalize_condition_value(value):
    """
    Normalize common boolean representations while preserving
    other values as strings.
    """

    if isinstance(value, bool):
        return value

    if value is None:
        return None

    normalized = str(value).strip().lower()

    if normalized in {
        "true",
        "yes",
        "1",
        "on",
    }:
        return True

    if normalized in {
        "false",
        "no",
        "0",
        "off",
    }:
        return False

    return normalized


def _condition_values_match(
    *,
    actual_value,
    expected_value,
):
    """
    Compare a runtime condition value with the Master-configured
    condition value.
    """

    return (
        _normalize_condition_value(actual_value)
        == _normalize_condition_value(expected_value)
    )


def _build_expense_condition_context(
    *,
    selected_types,
    registration_dubai,
    driving_license,
    service_package_selected,
):
    """
    Build the runtime condition context used by Master-configured
    conditional expenses.

    Expense names, types, amounts, and condition rules remain in
    Finance Master. This function only exposes current calculation
    state to the generic condition evaluator.
    """

    selected_expenses = {
        expense_type: True
        for expense_type in selected_types
    }

    return {
        "registration_dubai": registration_dubai,
        "driving_license": driving_license,
        "service_package_selected": service_package_selected,
        "selected_expenses": selected_expenses,
    }


def _evaluate_expense_condition(
    *,
    preset,
    condition_context,
    selected_types,
    applied_types,
):
    """
    Evaluate a conditional ExpensePreset without embedding any
    expense-specific business rule in the calculation service.

    A condition key may refer to:
      1. A direct calculation-context value.
      2. A selected expense type.
      3. An already-applied expense type.
    """

    condition_key = str(
        preset.condition_key or ""
    ).strip()

    if not condition_key:
        return False

    if condition_key in condition_context:
        actual_value = condition_context[condition_key]
    elif condition_key in selected_types:
        actual_value = True
    elif condition_key in applied_types:
        actual_value = True
    else:
        actual_value = False
    return _condition_values_match(
        actual_value=actual_value,
        expected_value=preset.condition_value,
    )


# =========================================================
# MASTER EXPENSE RESOLUTION
# =========================================================


def _resolve_master_expenses(
    *,
    vehicle_price,
    bank_id,
    expenses=None,
    registration_dubai=False,
    driving_license=True,
    service_package_selected=False,
    service_package_id=None,
):
    """
    Resolve all applicable expenses from Finance Master.

    Frontend supplies selections and current calculation inputs only.
    Financial values and conditional rules always come from the
    Master configuration.

    Conditional presets are evaluated automatically when their
    configured condition is satisfied; they do not need to be
    hardcoded into the frontend.
    """

    expenses = expenses or []

    selected_types = []

    for item in expenses:
        if not isinstance(item, dict):
            continue

        expense_type = item.get(
            "expense_type"
        )

        if expense_type:
            expense_type = str(
                expense_type
            ).strip()

            if expense_type not in selected_types:
                selected_types.append(
                    expense_type
                )

    condition_context = _build_expense_condition_context(
        selected_types=selected_types,
        registration_dubai=registration_dubai,
        driving_license=driving_license,
        service_package_selected=service_package_selected,
    )

    result = {
        "rta": {
            "selected": False,
            "name": "",
            "description": "",
            "amount": ZERO,
        },
        "registration": {
            "selected": False,
            "name": "",
            "description": "",
            "amount": ZERO,
        },
        "evaluation": {
            "selected": False,
            "name": "",
            "description": "",
            "amount": ZERO,
        },
        "bank_process": {
            "selected": False,
            "name": "Bank Processing",
            "description": "",
            "amount": ZERO,
        },
        "insurance": {
            "selected": False,
            "name": "",
            "description": "",
            "amount": ZERO,
            "base_amount": ZERO,
            "surcharge_amount": ZERO,
        },
        "service_package": {
            "selected": False,
            "name": "",
            "description": "",
            "amount": ZERO,
        },
        "future": [],
    }

    # -----------------------------------------------------
    # RTA
    # -----------------------------------------------------

    if "rta" in selected_types:
        preset, amount = resolve_rta_passing()

        result["rta"] = {
            "selected": True,
            "name": preset.name,
            "description": "",
            "amount": amount,
        }

    # -----------------------------------------------------
    # Registration
    # -----------------------------------------------------

    if "registration" in selected_types:
        preset, amount = resolve_registration(
            dubai_registration=registration_dubai,
        )

        result["registration"] = {
            "selected": True,
            "name": preset.name,
            "description": "",
            "amount": amount,
        }

    # -----------------------------------------------------
    # Evaluation
    # -----------------------------------------------------

    if "evaluation" in selected_types:
        preset, amount = resolve_evaluation()

        result["evaluation"] = {
            "selected": True,
            "name": preset.name,
            "description": "",
            "amount": amount,
        }

    # -----------------------------------------------------
    # Bank Processing
    # -----------------------------------------------------

    if "bank_process" in selected_types:
        processing = (
            resolve_bank_processing_amount(
                bank_id=bank_id,
                vehicle_price=vehicle_price,
            )
        )

        result["bank_process"] = {
            "selected": True,
            "name": "Bank Processing",
            "description": "",
            "amount": processing["amount"],
        }

    # -----------------------------------------------------
    # Insurance
    # -----------------------------------------------------

    if "insurance" in selected_types:
        insurance = resolve_insurance_amount(
            vehicle_price=vehicle_price,
            driving_license=driving_license,
        )

        result["insurance"] = {
            "selected": True,
            "name": insurance["band"].name,
            "description": "",
            "amount": insurance["total_amount"],
            "base_amount": insurance[
                "base_amount"
            ],
            "surcharge_amount": insurance[
                "surcharge_amount"
            ],
        }

    # -----------------------------------------------------
    # Service Package
    # -----------------------------------------------------

    if (
        service_package_selected
        or "service_package" in selected_types
    ):
        package = resolve_service_package(
            selected=True,
            service_package_id=service_package_id,

        )

        result["service_package"] = {
            "selected": True,
            "name": package["package"].name,
            "description": (
                package["package"].description
                or ""
            ),
            "amount": package["amount"],
        }

    # -----------------------------------------------------
    # Generic selected expenses
    # -----------------------------------------------------

    known_types = {
        "rta",
        "registration",
        "evaluation",
        "bank_process",
        "insurance",
        "service_package",
    }

    applied_types = set()

    for expense_type in selected_types:
        if expense_type in known_types:
            applied_types.add(expense_type)
            continue

        try:
            preset = resolve_future_expense(
                expense_type=expense_type,
            )
        except ExpensePreset.DoesNotExist:
            raise DjangoValidationError(
                f"No active expense configuration exists "
                f"for '{expense_type}'."
            )

        amount = ZERO

        if preset.calculation_type == "fixed":
            amount = _money(preset.amount)

        elif preset.calculation_type == "percentage_minimum":
            percentage_amount = (
                vehicle_price
                * _decimal(preset.percentage)
                / Decimal("100")
            )

            amount = _money(
                max(
                    percentage_amount,
                    _decimal(preset.minimum_amount),
                )
            )

        elif preset.calculation_type == "conditional":
            if not _evaluate_expense_condition(
                preset=preset,
                condition_context=condition_context,
                selected_types=selected_types,
                applied_types=applied_types,
            ):
                continue

            amount = _money(preset.amount)

        else:
            raise DjangoValidationError(
                f"Unsupported calculation type "
                f"'{preset.calculation_type}' "
                f"for expense '{expense_type}'."
            )

        result["future"].append(
            {
                "selected": True,
                "expense_type": expense_type,
                "name": preset.name,
                "description": "",
                "amount": amount,
            }
        )

        applied_types.add(expense_type)

    # -----------------------------------------------------
    # Generic conditional expenses from Master
    # -----------------------------------------------------


    # -----------------------------------------------------
    # Total
    # -----------------------------------------------------

    total = ZERO

    for key in (
        "rta",
        "registration",
        "evaluation",
        "bank_process",
        "insurance",
        "service_package",
    ):
        total += result[key]["amount"]

    for item in result["future"]:
        total += item["amount"]

    result["total"] = _money(total)

    return result


# =========================================================
# EXPENSE NORMALIZATION
# =========================================================


def _normalize_expenses(
    *,
    resolved_expenses,
    original_expenses=None,
    include_other_expenses=True,
):
    """
    Convert resolved Master expense data into the exact
    historical EmiExpense records that were actually applied.

    Frontend amounts are ignored.

    Frontend descriptions are retained because descriptions
    are informational rather than financial.
    """

    original_expenses = (
        original_expenses or []
    )

    descriptions = {}

    for item in original_expenses:
        if not isinstance(item, dict):
            continue

        expense_type = item.get(
            "expense_type"
        )

        if not expense_type:
            continue

        descriptions[
            str(expense_type).strip()
        ] = (
            item.get("description")
            or ""
        ).strip()

    normalized = []

    if not include_other_expenses:
        return normalized

    mapping = (
        ("rta", "rta"),
        ("registration", "registration"),
        ("evaluation", "evaluation"),
        ("bank_process", "bank_process"),
        ("insurance", "insurance"),
        ("service_package", "service_package"),
    )

    for expense_type, key in mapping:
        item = resolved_expenses[key]

        if not item["selected"]:
            continue

        normalized.append(
            {
                "expense_type": expense_type,
                "name": item["name"],
                "description": descriptions.get(
                    expense_type,
                    item.get(
                        "description",
                        "",
                    ),
                ),
                "amount": _money(
                    item["amount"]
                ),
            }
        )

    for item in resolved_expenses[
        "future"
    ]:
        normalized.append(
            {
                "expense_type": item[
                    "expense_type"
                ],
                "name": item["name"],
                "description": descriptions.get(
                    item["expense_type"],
                    item.get(
                        "description",
                        "",
                    ),
                ),
                "amount": _money(
                    item["amount"]
                ),
            }
        )

    return normalized


# =========================================================
# EXPENSE SELECTION SNAPSHOT
# =========================================================


def _build_expense_selection(
    *,
    resolved_expenses,
    include_other_expenses,
):
    """
    Build a historical JSON-safe selection snapshot.
    """

    selection = {
        "include_other_expenses": bool(
            include_other_expenses
        ),
        "rta_passing": bool(
            resolved_expenses["rta"]["selected"]
        ),
        "registration": bool(
            resolved_expenses[
                "registration"
            ]["selected"]
        ),
        "evaluation": bool(
            resolved_expenses[
                "evaluation"
            ]["selected"]
        ),
        "bank_processing": bool(
            resolved_expenses[
                "bank_process"
            ]["selected"]
        ),
        "insurance": bool(
            resolved_expenses[
                "insurance"
            ]["selected"]
        ),
        "service_package": bool(
            resolved_expenses[
                "service_package"
            ]["selected"]
        ),
    }

    for item in resolved_expenses[
        "future"
    ]:
        selection[
            item["expense_type"]
        ] = True

    return selection


# =========================================================
# APPLICATION CHARGE
# =========================================================


def resolve_banker_application_charge(
    *,
    bank_id,
):
    """
    Resolve the configured banker application charge.

    This is deliberately database-driven.

    Do not hardcode ADCB or any other bank amount here.
    """

    try:
        configuration = (
            get_active_bank_processing_configuration(
                bank_id
            )
        )
    except BankProcessingConfiguration.DoesNotExist:
        return ZERO

    return _money(
        getattr(
            configuration,
            "application_charge",
            ZERO,
        )
    )


# =========================================================
# EMI CALCULATION
# =========================================================


def calculate_emi(
    *,
    vehicle_price,
    down_payment,
    tenure_years=5,
    bank_id,
    vat_enabled=False,
    manual_interest_rate=None,
    expenses=None,
    include_other_expenses=True,
    registration_dubai=False,
    driving_license=True,
    service_package_selected=False,
    service_package_id=None,
    **kwargs,
):
    """
    Calculate an EMI without saving anything.

    This function is authoritative.

    It does not trust frontend financial amounts.
    """

    validation = _validate_financial_inputs(
        vehicle_price=vehicle_price,
        down_payment=down_payment,
        tenure_years=tenure_years,
        vat_enabled=vat_enabled,
    )

    vehicle_price = validation[
        "vehicle_price"
    ]

    down_payment = validation[
        "down_payment"
    ]

    tenure_years = validation[
        "tenure_years"
    ]

    vat_amount = validation[
        "vat_amount"
    ]

    price_after_vat = validation[
        "price_after_vat"
    ]

    # -----------------------------------------------------
    # Bank
    # -----------------------------------------------------

    bank, configured_interest_rate = (
        resolve_active_bank(
            bank_id=bank_id
        )
    )

    manual_rate_used = (
        manual_interest_rate is not None
        and not bank.is_cash
    )

    if bank.is_cash:
        interest_rate = ZERO
        manual_rate_used = False
    elif manual_rate_used:
        interest_rate = _money(
            _decimal(
                manual_interest_rate
            )
        )
    else:
        interest_rate = (
            configured_interest_rate
        )

    # -----------------------------------------------------
    # Master expenses
    # -----------------------------------------------------

    resolved_expenses = _resolve_master_expenses(
    vehicle_price=vehicle_price,
    bank_id=bank_id,
    expenses=expenses,
    registration_dubai=registration_dubai,
    driving_license=driving_license,
    service_package_selected=service_package_selected,
    service_package_id=service_package_id,
)

    normalized_expenses = (
        _normalize_expenses(
            resolved_expenses=(
                resolved_expenses
            ),
            original_expenses=expenses,
            include_other_expenses=(
                include_other_expenses
            ),
        )
    )

    if include_other_expenses:
        expense_total = _money(
            sum(
                (
                    item["amount"]
                    for item in normalized_expenses
                ),
                ZERO,
            )
        )
    else:
        expense_total = ZERO

    # -----------------------------------------------------
    # Banker application charge
    # -----------------------------------------------------

    banker_application_charge = (
        resolve_banker_application_charge(
            bank_id=bank_id,
        )
    )

    # -----------------------------------------------------
    # Unit price after down payment
    # -----------------------------------------------------

    unit_price_after_down_payment = _money(
        vehicle_price
        + vat_amount
        - down_payment
    )

    # -----------------------------------------------------
    # Finance amount
    #
    # vehicle price
    # + VAT
    # + selected expenses
    # + banker application charge
    # - down payment
    # -----------------------------------------------------

    finance_amount = _money(
        vehicle_price
        + vat_amount
        + expense_total
        + banker_application_charge
        - down_payment
    )
    car_value_evaluation = _money(
            finance_amount
            * Decimal("100")
            / Decimal("80")
        )

    if finance_amount < ZERO:
        _raise_validation(
            "Finance amount cannot be negative.",
            field="down_payment",
        )

    # emi_principal is retained as the historical
    # principal used by the existing model.
    emi_principal = finance_amount

    # -----------------------------------------------------
    # Flat-rate interest
    # -----------------------------------------------------

    annual_interest = _money(
        finance_amount
        * interest_rate
        / Decimal("100")
    )

    total_interest = _money(
        annual_interest
        * Decimal(str(tenure_years))
    )

    total_payable = _money(
        finance_amount
        + total_interest
    )

    months = tenure_years * 12

    if months <= 0:
        _raise_validation(
            "Tenure must be greater than zero.",
            field="tenure_years",
        )

    monthly_emi = _money(
        total_payable
        / Decimal(str(months))
    )

    # -----------------------------------------------------
    # Expense snapshots
    # -----------------------------------------------------

    evaluation = (
        resolved_expenses[
            "evaluation"
        ]
    )

    rta = resolved_expenses[
        "rta"
    ]

    registration = (
        resolved_expenses[
            "registration"
        ]
    )

    bank_processing = (
        resolved_expenses[
            "bank_process"
        ]
    )

    insurance = (
        resolved_expenses[
            "insurance"
        ]
    )

    service_package = (
        resolved_expenses[
            "service_package"
        ]
    )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        # ---------------------------------------------
        # Bank
        # ---------------------------------------------

        "bank": bank.id,
        "bank_id": bank.id,
        "bank_name": bank.name,
        "interest_rate": _money(
            interest_rate
        ),
        "manual_rate_used": (
            manual_rate_used
        ),

        # ---------------------------------------------
        # Inputs
        # ---------------------------------------------

        "vehicle_price": vehicle_price,
        "vat_enabled":True,
        "vat_amount": vat_amount,
        "price_after_vat": price_after_vat,
        "down_payment": down_payment,
        "tenure_years": tenure_years,

        # ---------------------------------------------
        # Expenses
        # ---------------------------------------------

        "include_other_expenses": bool(
            include_other_expenses
        ),
        "expense_selection": (
            _build_expense_selection(
                resolved_expenses=(
                    resolved_expenses
                ),
                include_other_expenses=(
                    include_other_expenses
                ),
            )
        ),
        "expense_total": expense_total,
        "expenses": normalized_expenses,

        "rta_amount": (
            rta["amount"]
            if include_other_expenses
            else ZERO
        ),

        "registration_amount": (
            registration["amount"]
            if include_other_expenses
            else ZERO
        ),

        "evaluation_name": (
            evaluation["name"]
            if include_other_expenses
            else ""
        ),

        "evaluation_amount": (
            evaluation["amount"]
            if include_other_expenses
            else ZERO
        ),

        "bank_processing_amount": (
            bank_processing["amount"]
            if include_other_expenses
            else ZERO
        ),

        "insurance_band_name": (
            insurance["name"]
            if include_other_expenses
            else ""
        ),

        "insurance_amount": (
            insurance["amount"]
            if include_other_expenses
            else ZERO
        ),

        "insurance_surcharge_amount": (
            insurance[
                "surcharge_amount"
            ]
            if include_other_expenses
            else ZERO
        ),

        "service_package_name": (
            service_package["name"]
            if include_other_expenses
            and service_package[
                "selected"
            ]
            else ""
        ),

        "service_package_amount": (
            service_package["amount"]
            if include_other_expenses
            else ZERO
        ),

        "service_package_selected": bool(
            service_package["selected"]
        ),

        "registration_dubai": bool(
            registration_dubai
        ),

        "driving_license": bool(
            driving_license
        ),

        # ---------------------------------------------
        # Banker application charge
        # ---------------------------------------------

        "banker_application_charge": (
            banker_application_charge
        ),

        # ---------------------------------------------
        # Finance
        # ---------------------------------------------

        "unit_price_after_down_payment": (
            unit_price_after_down_payment
        ),

        "finance_amount": finance_amount,
        "car_value_evaluation": car_value_evaluation,
        "emi_principal": emi_principal,

        # ---------------------------------------------
        # Results
        # ---------------------------------------------

        "annual_interest": annual_interest,
        "total_interest": total_interest,
        "total_payable": total_payable,
        "monthly_emi": monthly_emi,
    }


# =========================================================
# VEHICLE SNAPSHOT
# =========================================================


def resolve_vehicle_snapshot(
    *,
    car_id=None,
    manual_vehicle=None,
):
    """
    Resolve the vehicle source and produce the historical
    snapshot that will be stored on EmiSheet.
    """

    has_car = car_id is not None
    has_manual = manual_vehicle is not None

    if has_car and has_manual:
        _raise_validation(
            "Provide either car_id or manual_vehicle, "
            "not both.",
            field="vehicle",
        )

    if not has_car and not has_manual:
        _raise_validation(
            "Either car_id or manual_vehicle must be provided.",
            field="vehicle",
        )

    if has_car:
        try:
            car = Car.objects.get(
                pk=car_id
            )
        except Car.DoesNotExist:
            _raise_validation(
                "Selected vehicle does not exist.",
                field="car_id",
            )

        if not car.stock_id:
            _raise_validation(
                "Selected vehicle has no stock ID.",
                field="car_id",
            )

        return {
            "car": car,
            "vehicle_stock_id": (
                car.stock_id or ""
            ),
            "vehicle_make": (
                car.make or ""
            ),
            "vehicle_model": (
                car.model or ""
            ),
            "vehicle_variant": (
                getattr(
                    car,
                    "variant",
                    "",
                )
                or ""
            ),
            "vehicle_year": (
                car.year
            ),
            "vehicle_colour": (
                getattr(
                    car,
                    "colour",
                    "",
                )
                or ""
            ),
            "vehicle_mileage": (
                getattr(
                    car,
                    "mileage",
                    None,
                )
            ),
            "vehicle_chassis_number": (
                getattr(
                    car,
                    "chassis_number",
                    "",
                )
                or ""
            ),
            "vehicle_engine_number": (
                getattr(
                    car,
                    "engine_number",
                    "",
                )
                or ""
            ),
        }

    manual_vehicle = (
        manual_vehicle or {}
    )

    return {
        "car": None,
        "vehicle_stock_id": "",
        "vehicle_make": (
            manual_vehicle.get(
                "make",
                "",
            )
            or ""
        ),
        "vehicle_model": (
            manual_vehicle.get(
                "model",
                "",
            )
            or ""
        ),
        "vehicle_variant": (
            manual_vehicle.get(
                "variant",
                "",
            )
            or ""
        ),
        "vehicle_year": (
            manual_vehicle.get(
                "year"
            )
        ),
        "vehicle_colour": (
            manual_vehicle.get(
                "colour",
                "",
            )
            or ""
        ),
        "vehicle_mileage": (
            manual_vehicle.get(
                "mileage"
            )
        ),
        "vehicle_chassis_number": (
            manual_vehicle.get(
                "chassis_number",
                "",
            )
            or ""
        ),
        "vehicle_engine_number": (
            manual_vehicle.get(
                "engine_number",
                "",
            )
            or ""
        ),
    }


# =========================================================
# EMI NUMBER GENERATION
# =========================================================


def generate_emi_number():
    """
    Generate a concurrency-safe EMI number.

    The sequence row is created automatically if it does not
    exist. This fixes the fresh-database EmiSequence bug.
    """

    sequence, _created = (
        EmiSequence.objects.get_or_create(
            name="emi",
            defaults={
                "current_number": 0,
            },
        )
    )

    sequence = (
        EmiSequence.objects
        .select_for_update()
        .get(
            pk=sequence.pk
        )
    )

    sequence.current_number += 1

    sequence.save(
        update_fields=[
            "current_number"
        ]
    )

    return (
        f"EMI-{sequence.current_number:04d}"
    )

def resolve_customer(
    *,
    customer_name,
    customer_mobile,
):
    """
    Find an existing Customer by normalized phone number
    or create a new Customer.

    Customer matching is based on phone number.
    """

    customer_name = (
        customer_name or ""
    ).strip()

    customer_mobile = (
        customer_mobile or ""
    ).strip()

    if not customer_mobile:
        _raise_validation(
            "Customer mobile is required.",
            field="customer_mobile",
        )

    customer = (
        Customer.objects
        .filter(
            phone_number=customer_mobile,
        )
        .first()
    )

    if customer is not None:
        return customer, False

    customer = Customer.objects.create(
        customer_name=customer_name,
        phone_number=customer_mobile,
        email="",
        # Agent stays null for now.
    )

    return customer, True
# =========================================================
# CREATE EMI SHEET
# =========================================================
def _resolve_special_price_for_emi(
    *,
    car,
    vehicle_price,
    created_by=None,
    special_price_request_id=None,
):
    """
    Validate a transaction-specific Special Price approval for an EMI.

    This is enforced only when the EMI is persisted.
    calculate_emi() remains a calculation/preview function.

    Returns:
        SpecialPriceRequest | None
    """

    if car is None:
        return None

    current_price = _money(vehicle_price)

    least_selling_price = car.least_selling_price

    if least_selling_price is None:
        return None

    # Normal price: no Special Price approval is needed.
    if current_price >= least_selling_price:
        if special_price_request_id is not None:
            raise DjangoValidationError(
                "A Special Price approval is only valid for "
                "a selling price below the vehicle's Least Selling Price."
            )

        return None

    # A price below Least Selling Price requires either:
    # 1. Master user, or
    # 2. a valid approved Special Price request.
    user_role = getattr(
        created_by,
        "role",
        None,
    )

    if user_role == "MASTER":
        if special_price_request_id is not None:
            raise DjangoValidationError(
                "Master users do not need a Special Price approval."
            )

        return None

    if special_price_request_id is None:
        raise DjangoValidationError(
            {
                "vehicle_price": (
                    "Selling price is below the vehicle's "
                    "Least Selling Price. Master Special Price "
                    "approval is required."
                )
            }
        )

    special_request = (
        SpecialPriceRequest.objects
        .select_for_update()
        .select_related("car")
        .filter(
            pk=special_price_request_id,
        )
        .first()
    )

    if special_request is None:
        raise DjangoValidationError(
            {
                "special_price_request_id": (
                    "Special Price approval was not found."
                )
            }
        )

    # The approval must belong to this exact vehicle.
    if special_request.car_id != car.id:
        raise DjangoValidationError(
            {
                "special_price_request_id": (
                    "The Special Price approval does not belong "
                    "to the selected vehicle."
                )
            }
        )

    # Only approved requests can be consumed.
    if special_request.status != (
        SpecialPriceRequest.Status.APPROVED
    ):
        if special_request.status == (
            SpecialPriceRequest.Status.EXPIRED
        ):
            raise DjangoValidationError(
                {
                    "special_price_request_id": (
                        "The Special Price approval has expired."
                    )
                }
            )

        if special_request.status == (
            SpecialPriceRequest.Status.USED
        ):
            raise DjangoValidationError(
                {
                    "special_price_request_id": (
                        "The Special Price approval has already been used."
                    )
                }
            )

        raise DjangoValidationError(
            {
                "special_price_request_id": (
                    "The Special Price request is not approved."
                )
            }
        )

    # Check expiry at the moment the EMI is created.
    if (
        special_request.expires_at is not None
        and special_request.expires_at <= timezone.now()
    ):
        special_request.status = (
            SpecialPriceRequest.Status.EXPIRED
        )

        special_request.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        raise DjangoValidationError(
            {
                "special_price_request_id": (
                    "The Special Price approval has expired."
                )
            }
        )

    # The approved transaction price must exactly match
    # the Special Price approval.
    if special_request.approved_price != current_price:
        raise DjangoValidationError(
            {
                "vehicle_price": (
                    "Vehicle price must match the approved "
                    "Special Price amount."
                )
            }
        )

    # Approval was created for this vehicle's pricing context.
    if (
        special_request.least_selling_price_at_request
        is not None
        and current_price >= (
            special_request.least_selling_price_at_request
        )
    ):
        raise DjangoValidationError(
            {
                "vehicle_price": (
                    "The approved Special Price is not below "
                    "the Least Selling Price captured at approval."
                )
            }
        )

    return special_request

@transaction.atomic
@transaction.atomic
def create_emi_sheet(
    *,
    customer_name,
    customer_mobile,
    car_id=None,
    manual_vehicle=None,
    vehicle_price,
    vat_enabled=False,
    down_payment,
    tenure_years=5,
    bank_id,
    manual_interest_rate=None,
    expenses=None,
    include_other_expenses=True,
    registration_dubai=False,
    driving_license=True,
    service_package_selected=False,
    service_package_id=None,
    created_by=None,
    special_price_request_id=None,
    **kwargs,
):
    """
    Recalculate and persist an EMI sheet.

    Never trusts frontend calculation values.

    All Master-controlled values are resolved again inside
    the transaction immediately before saving.
    """
    customer, customer_created = resolve_customer(
        customer_name=customer_name,
        customer_mobile=customer_mobile,
    )
    # -----------------------------------------------------
    # Vehicle snapshot
    # -----------------------------------------------------

    vehicle = resolve_vehicle_snapshot(
        car_id=car_id,
        manual_vehicle=manual_vehicle,
    )

    # -----------------------------------------------------
    # Special Price transaction validation
    # -----------------------------------------------------

    special_price_request = _resolve_special_price_for_emi(
        car=vehicle["car"],
        vehicle_price=vehicle_price,
        created_by=created_by,
        special_price_request_id=special_price_request_id,
    )

    # -----------------------------------------------------
    # Authoritative calculation
    # -----------------------------------------------------

    calculation = calculate_emi(
        vehicle_price=vehicle_price,
        down_payment=down_payment,
        tenure_years=tenure_years,
        bank_id=bank_id,
        vat_enabled=vat_enabled,
        manual_interest_rate=(
            manual_interest_rate
        ),
        expenses=expenses,
        include_other_expenses=(
            include_other_expenses
        ),
        registration_dubai=(
            registration_dubai
        ),
        driving_license=(
            driving_license
        ),
        service_package_selected=(
            service_package_selected
        ),
        service_package_id=service_package_id,
    )

    # -----------------------------------------------------
    # Resolve bank again for historical FK
    # -----------------------------------------------------

    bank, _rate = resolve_active_bank(
        bank_id=bank_id
    )

    # -----------------------------------------------------
    # EMI number
    # -----------------------------------------------------

    emi_number = generate_emi_number()

    # -----------------------------------------------------
    # Create historical EMI snapshot
    # -----------------------------------------------------

    emi_sheet = EmiSheet.objects.create(
        emi_number=emi_number,
        created_by=created_by,


        # ---------------------------------------------
        # Customer
        # ---------------------------------------------
        customer=customer,
        customer_name=(
            customer_name or ""
        ).strip(),

        customer_mobile=(
            customer_mobile or ""
        ).strip(),

        # ---------------------------------------------
        # Vehicle
        # ---------------------------------------------

        car=vehicle["car"],

        vehicle_stock_id=(
            vehicle["vehicle_stock_id"]
        ),

        vehicle_make=(
            vehicle["vehicle_make"]
        ),

        vehicle_model=(
            vehicle["vehicle_model"]
        ),

        vehicle_variant=(
            vehicle["vehicle_variant"]
        ),

        vehicle_year=(
            vehicle["vehicle_year"]
        ),

        vehicle_colour=(
            vehicle["vehicle_colour"]
        ),

        vehicle_mileage=(
            vehicle["vehicle_mileage"]
        ),

        vehicle_chassis_number=(
            vehicle[
                "vehicle_chassis_number"
            ]
        ),

        vehicle_engine_number=(
            vehicle[
                "vehicle_engine_number"
            ]
        ),

        # ---------------------------------------------
        # Bank snapshot
        # ---------------------------------------------

        bank=bank,

        bank_name=bank.name,

        manual_rate_used=(
            calculation[
                "manual_rate_used"
            ]
        ),

        interest_rate=(
            calculation[
                "interest_rate"
            ]
        ),

        # ---------------------------------------------
        # Inputs
        # ---------------------------------------------

        vehicle_price=(
            calculation[
                "vehicle_price"
            ]
        ),

        vat_enabled=(
            calculation[
                "vat_enabled"
            ]
        ),

        vat_amount=(
            calculation[
                "vat_amount"
            ]
        ),

        price_after_vat=(
            calculation[
                "price_after_vat"
            ]
        ),

        down_payment=(
            calculation[
                "down_payment"
            ]
        ),

        tenure_years=(
            calculation[
                "tenure_years"
            ]
        ),

        # ---------------------------------------------
        # Finance
        # ---------------------------------------------

        finance_amount=(
            calculation[
                "finance_amount"
            ]
        ),
        car_value_evaluation=(
            calculation[
                "car_value_evaluation"
            ]
        ),

        emi_principal=(
            calculation[
                "emi_principal"
            ]
        ),

        expense_total=(
            calculation[
                "expense_total"
            ]
        ),

        unit_price_after_down_payment=(
            calculation[
                "unit_price_after_down_payment"
            ]
        ),

        banker_application_charge=(
            calculation[
                "banker_application_charge"
            ]
        ),

        # ---------------------------------------------
        # Expense configuration snapshot
        # ---------------------------------------------

        expense_selection=(
            calculation[
                "expense_selection"
            ]
        ),

        include_other_expenses=(
            calculation[
                "include_other_expenses"
            ]
        ),

        registration_dubai=(
            calculation[
                "registration_dubai"
            ]
        ),

        driving_license=(
            calculation[
                "driving_license"
            ]
        ),

        # ---------------------------------------------
        # Individual expense snapshots
        # ---------------------------------------------

        rta_amount=(
            calculation[
                "rta_amount"
            ]
        ),

        registration_amount=(
            calculation[
                "registration_amount"
            ]
        ),

        evaluation_name=(
            calculation[
                "evaluation_name"
            ]
        ),

        evaluation_amount=(
            calculation[
                "evaluation_amount"
            ]
        ),

        bank_processing_amount=(
            calculation[
                "bank_processing_amount"
            ]
        ),

        insurance_band_name=(
            calculation[
                "insurance_band_name"
            ]
        ),

        insurance_amount=(
            calculation[
                "insurance_amount"
            ]
        ),

        insurance_surcharge_amount=(
            calculation[
                "insurance_surcharge_amount"
            ]
        ),

        service_package_name=(
            calculation[
                "service_package_name"
            ]
        ),

        service_package_amount=(
            calculation[
                "service_package_amount"
            ]
        ),

        service_package_selected=(
            calculation[
                "service_package_selected"
            ]
        ),

        # ---------------------------------------------
        # Results
        # ---------------------------------------------

        total_interest=(
            calculation[
                "total_interest"
            ]
        ),

        total_payable=(
            calculation[
                "total_payable"
            ]
        ),

        monthly_emi=(
            calculation[
                "monthly_emi"
            ]
        ),
    )

    # -----------------------------------------------------
    # Create historical individual expenses
    # -----------------------------------------------------

    normalized_expenses = (
        calculation["expenses"]
    )

    for expense in normalized_expenses:
        EmiExpense.objects.create(
            emi_sheet=emi_sheet,

            expense_type=(
                expense[
                    "expense_type"
                ]
            ),

            name=(
                expense.get(
                    "name",
                    "",
                )
                or ""
            ),

            description=(
                expense.get(
                    "description",
                    "",
                )
                or ""
            ),

            amount=_money(
                expense["amount"]
            ),
        )
    # -----------------------------------------------------
    # Bind / consume Special Price approval
    # -----------------------------------------------------

    if special_price_request is not None:
        special_price_request.emi_sheet = emi_sheet
        special_price_request.status = (
            SpecialPriceRequest.Status.USED
        )
        special_price_request.used_at = timezone.now()
        special_price_request.used_by = created_by

        special_price_request.save(
            update_fields=[
                "emi_sheet",
                "status",
                "used_at",
                "used_by",
                "updated_at",
            ]
        )

    return emi_sheet


@transaction.atomic
def update_emi_sheet(
    *,
    emi_sheet,
    customer_name=None,
    customer_mobile=None,
):
    """
    Update editable EMI sheet information.

    Financial and historical snapshot fields are intentionally
    not recalculated or modified.
    """

    if customer_name is not None:
        emi_sheet.customer_name = customer_name.strip()

    if customer_mobile is not None:
        emi_sheet.customer_mobile = customer_mobile.strip()

    emi_sheet.save(
        update_fields=[
            "customer_name",
            "customer_mobile",
            "updated_at",
        ]
    )

    return emi_sheet

# =========================================================
# BACKWARD-COMPATIBLE GENERIC FIXED EXPENSE
# =========================================================


def resolve_selected_fixed_expense(
    *,
    expense_type,
):
    """
    Backward-compatible generic fixed expense resolver.
    """

    preset, amount = (
        resolve_fixed_expense_amount(
            expense_type=expense_type,
        )
    )

    return {
        "preset": preset,
        "amount": amount,
    }

# =========================================================
# BANK LOAN SERVICES
# =========================================================

BANK_LOAN_STATUS_TRANSITIONS = {
    BankLoan.Status.PENDING: {
        BankLoan.Status.PENDING,
        BankLoan.Status.APPROVED,
        BankLoan.Status.REJECTED,
    },
    BankLoan.Status.APPROVED: {
        BankLoan.Status.APPROVED,
    },
    BankLoan.Status.REJECTED: {
        BankLoan.Status.REJECTED,
    },
}


def validate_bank_loan_status_transition(
    *,
    current_status,
    new_status,
):
    if current_status == new_status:
        return

    allowed = BANK_LOAN_STATUS_TRANSITIONS.get(
        current_status,
        set(),
    )

    if new_status not in allowed:
        raise DjangoValidationError(
            f"Cannot change Bank Loan status from "
            f"{current_status} to {new_status}."
        )

def validate_quote_for_bank_loan(
    *,
    quote,
):
    if quote.payment_method != Quote.PaymentMethod.FINANCE:
        raise DjangoValidationError(
            "Only Finance Quotes can proceed to a Bank Loan."
        )

    if quote.status != Quote.Status.BOOKED:
        raise DjangoValidationError(
            "The Quote must be Booked before proceeding "
            "to a Bank Loan."
        )

    if quote.emi_sheet is None:
        raise DjangoValidationError(
            "A Finance Quote must have an EMI Sheet "
            "before a Bank Loan can be created."
        )

    if quote.customer is None:
        raise DjangoValidationError(
            "The Quote must have an associated Customer."
        )

def validate_bank_for_new_loan(
    *,
    bank_id,
):
    bank, interest_rate = resolve_active_bank(
        bank_id=bank_id,
    )

    if bank.is_cash:
        raise DjangoValidationError(
            "A cash bank cannot be used for a Bank Loan."
        )

    return bank, interest_rate


@transaction.atomic
def create_bank_loan_from_quote(
    *,
    quote,
    bank_id=None,
    agent=None,
    priority=BankLoan.Priority.MEDIUM,
):
    validate_quote_for_bank_loan(
        quote=quote,
    )

    emi_sheet = quote.emi_sheet

    active_loan_exists = quote.bank_loans.filter(
        status__in=[
            BankLoan.Status.PENDING,
            BankLoan.Status.APPROVED,
        ]
    ).exists()

    if active_loan_exists:
        raise DjangoValidationError(
            {"quote": "An active bank loan application already exists for this quote."}
        )

    # Use the bank from the EMI/Finance configuration
    # unless a different bank is explicitly selected.
    selected_bank_id = (
        bank_id
        if bank_id is not None
        else emi_sheet.bank_id
    )

    bank, interest_rate = validate_bank_for_new_loan(
        bank_id=selected_bank_id,
    )

    customer = quote.customer

    car = quote.car or emi_sheet.car

    agent = agent or quote.salesperson

    # -----------------------------------------------------
    # Historical customer snapshot
    # -----------------------------------------------------

    customer_name = (
        quote.customer_name
        or emi_sheet.customer_name
    )

    customer_mobile = (
        quote.customer_mobile
        or emi_sheet.customer_mobile
    )

    # -----------------------------------------------------
    # Historical vehicle snapshot
    # -----------------------------------------------------

    vehicle_stock_id = (
        quote.vehicle_stock_id
        or emi_sheet.vehicle_stock_id
    )

    vehicle_make = (
        quote.vehicle_make
        or emi_sheet.vehicle_make
    )

    vehicle_model = (
        quote.vehicle_model
        or emi_sheet.vehicle_model
    )

    vehicle_variant = (
        quote.vehicle_variant
        or emi_sheet.vehicle_variant
    )

    vehicle_year = (
        quote.vehicle_year
        if quote.vehicle_year is not None
        else emi_sheet.vehicle_year
    )

    vehicle_colour = (
        quote.vehicle_colour
        or emi_sheet.vehicle_colour
    )

    vehicle_mileage = (
        quote.vehicle_mileage
        if quote.vehicle_mileage is not None
        else emi_sheet.vehicle_mileage
    )

    vehicle_chassis_number = (
        quote.vehicle_chassis_number
        or emi_sheet.vehicle_chassis_number
    )

    vehicle_engine_number = (
        quote.vehicle_engine_number
        or emi_sheet.vehicle_engine_number
    )

    # -----------------------------------------------------
    # Requested finance
    # -----------------------------------------------------

    requested_finance = quote.emi_finance_amount

    if requested_finance is None:
        requested_finance = emi_sheet.finance_amount


    if priority is None:
        priority = BankLoan.Priority.MEDIUM
    # -----------------------------------------------------
    # Create Bank Loan
    # -----------------------------------------------------

    bank_loan = BankLoan.objects.create(
        quote=quote,

        customer=customer,

        car=car,

        agent=agent,

        bank=bank,

        bank_name=bank.name,

        interest_rate=interest_rate,

        customer_name=customer_name,

        customer_mobile=customer_mobile,

        vehicle_stock_id=vehicle_stock_id,

        vehicle_make=vehicle_make,

        vehicle_model=vehicle_model,

        vehicle_variant=vehicle_variant,

        vehicle_year=vehicle_year,

        vehicle_colour=vehicle_colour,

        vehicle_mileage=vehicle_mileage,

        vehicle_chassis_number=vehicle_chassis_number,

        vehicle_engine_number=vehicle_engine_number,

        requested_finance=requested_finance,

        approved_finance=None,

        selling_price=quote.price,
        evaluation=(
            quote.emi_sheet.car_value_evaluation
            if quote.emi_sheet is not None
            else Decimal("0.00")
        ),

        application_status=(
            BankLoan.ApplicationStatus.NOT_SUBMITTED
        ),

        status=BankLoan.Status.PENDING,

        priority=priority,

        emi_sheet=emi_sheet,
    )

    return bank_loan


def update_bank_loan_status(
    *,
    bank_loan,
    new_status,
):
    validate_bank_loan_status_transition(
        current_status=bank_loan.status,
        new_status=new_status,
    )

    bank_loan.status = new_status

    bank_loan.save(
        update_fields=[
            "status",
            "updated_at",
        ],
    )
    from progression.services import sync_progression_for_quote

    sync_progression_for_quote(
        quote_id=bank_loan.quote_id,
    )
    return bank_loan

@transaction.atomic
def update_bank_loan_finance(
    *,
    bank_loan,
    requested_finance=None,
    approved_finance=None,
):
    from finance.models import CashReceipt

    finance_receipt_exists = CashReceipt.objects.filter(
        quote_id=bank_loan.quote_id,
        direction=CashReceipt.Direction.CUSTOMER_PAYMENT,
        category=CashReceipt.Category.OTHER,
        amount=bank_loan.approved_finance,
    ).exists()

    if finance_receipt_exists:
        raise DjangoValidationError(
            "Finance cannot be edited because the approved finance Cash Receipt has already been created."
        )

    effective_requested = bank_loan.requested_finance
    effective_approved = bank_loan.approved_finance

    if requested_finance is not None:
        requested_finance = Decimal(requested_finance)

        if requested_finance < 0:
            raise DjangoValidationError(
                "Requested finance cannot be negative."
            )

        effective_requested = requested_finance

    if approved_finance is not None:
        approved_finance = Decimal(approved_finance)

        if approved_finance < 0:
            raise DjangoValidationError(
                "Approved finance cannot be negative."
            )

        effective_approved = approved_finance

    if (
        effective_requested is not None
        and effective_approved is not None
        and effective_approved > effective_requested
    ):
        raise DjangoValidationError(
            "Approved finance cannot exceed requested finance."
        )

    bank_loan.requested_finance = effective_requested
    bank_loan.approved_finance = effective_approved

    bank_loan.save(
        update_fields=[
            "requested_finance",
            "approved_finance",
            "updated_at",
        ],
    )

    return bank_loan


def update_bank_loan_priority(
    *,
    bank_loan,
    priority,
):
    valid_priorities = {
        choice[0]
        for choice in BankLoan.Priority.choices
    }

    if priority not in valid_priorities:
        raise DjangoValidationError(
            "Invalid Bank Loan priority."
        )

    bank_loan.priority = priority

    bank_loan.save(
        update_fields=[
            "priority",
            "updated_at",
        ],
    )

    return bank_loan


@transaction.atomic
def create_bank_loan_with_new_bank(
    *,
    bank_loan,
    bank_id,
    agent=None,
    priority=None,
):
    if bank_loan.status != BankLoan.Status.REJECTED:
        raise DjangoValidationError(
            "A new bank application can only be created "
            "from a rejected Bank Loan."
        )

    if bank_loan.quote is None:
        raise DjangoValidationError(
            "The Bank Loan must be linked to a Quote."
        )

    if bank_loan.quote.payment_method != Quote.PaymentMethod.FINANCE:
        raise DjangoValidationError(
            "Only Finance Quotes can proceed to a Bank Loan."
        )

    bank, interest_rate = validate_bank_for_new_loan(
        bank_id=bank_id,
    )

    if bank.id == bank_loan.bank_id:
        raise DjangoValidationError(
            "The new bank must be different from the rejected bank."
        )

    new_bank_loan = BankLoan.objects.create(
        quote=bank_loan.quote,
        customer=bank_loan.customer,
        car=bank_loan.car,
        agent=agent or bank_loan.agent,

        bank=bank,
        bank_name=bank.name,
        interest_rate=interest_rate,

        customer_name=bank_loan.customer_name,
        customer_mobile=bank_loan.customer_mobile,

        vehicle_stock_id=bank_loan.vehicle_stock_id,
        vehicle_make=bank_loan.vehicle_make,
        vehicle_model=bank_loan.vehicle_model,
        vehicle_variant=bank_loan.vehicle_variant,
        vehicle_year=bank_loan.vehicle_year,
        vehicle_colour=bank_loan.vehicle_colour,
        vehicle_mileage=bank_loan.vehicle_mileage,
        vehicle_chassis_number=bank_loan.vehicle_chassis_number,
        vehicle_engine_number=bank_loan.vehicle_engine_number,

        selling_price=bank_loan.selling_price,
        evaluation=bank_loan.evaluation,

        requested_finance=bank_loan.requested_finance,
        approved_finance=None,

        application_status=BankLoan.ApplicationStatus.NOT_SUBMITTED,
        status=BankLoan.Status.PENDING,

        priority=(
            priority
            if priority is not None
            else bank_loan.priority
        ),

        emi_sheet=bank_loan.emi_sheet,

        # New bank = new application
        application_number="",
        bank_reference="",
        relationship_manager="",
        application_date=None,
        expected_approval_date=None,
        remark="",
    )

    return new_bank_loan

@transaction.atomic
def create_bank_loan_follow_up(
    bank_loan,
    note,
    created_by,
    follow_up_date=None,
):
    if not note or not note.strip():
        raise DjangoValidationError({"note": "Follow-up note is required."})

    if created_by is None:
        raise DjangoValidationError({"created_by": "Created by is required."})

    return BankLoanFollowUp.objects.create(
        bank_loan=bank_loan,
        note=note.strip(),
        follow_up_date=follow_up_date,
        created_by=created_by,
    )


@transaction.atomic
def update_bank_loan_application_status(bank_loan, application_status):
    valid_statuses = {
        choice[0]
        for choice in BankLoan.ApplicationStatus.choices
    }

    if application_status not in valid_statuses:
        raise DjangoValidationError(
            {"application_status": "Invalid application status."}
        )

    bank_loan.application_status = application_status
    bank_loan.save(update_fields=["application_status", "updated_at"])

    return bank_loan

# =========================================================
# CASH DEAL
# =========================================================

@transaction.atomic
def create_cash_deal(
    *,
    quote,
):
    # -------------------------------------------------
    # Quote status validation
    # -------------------------------------------------

    if quote.status != Quote.Status.BOOKED:
        raise DjangoValidationError(
            "A Cash Deal can only be created from a booked Quote."
        )

    # -------------------------------------------------
    # Payment method validation
    # -------------------------------------------------

    if quote.payment_method != Quote.PaymentMethod.CASH:
        raise DjangoValidationError(
            "A Cash Deal can only be created for a Cash payment method."
        )

    # -------------------------------------------------
    # Duplicate prevention
    # -------------------------------------------------

    if CashDeal.objects.filter(
        quote=quote,
    ).exists():
        raise DjangoValidationError(
            "A Cash Deal already exists for this Quote."
        )

    # -------------------------------------------------
    # Required customer
    # -------------------------------------------------

    if not quote.customer:
        raise DjangoValidationError(
            "The Quote must have a customer before creating a Cash Deal."
        )

    # -------------------------------------------------
    # Required vehicle
    # -------------------------------------------------

    car = quote.car

    if not car:
        raise DjangoValidationError(
            "The Quote must have a vehicle before creating a Cash Deal."
        )

    # -------------------------------------------------
    # Required salesperson
    # -------------------------------------------------

    agent = quote.salesperson

    # -------------------------------------------------
    # Selling price
    # -------------------------------------------------

    selling_price = quote.price

    if selling_price is None:
        raise DjangoValidationError(
            "The Quote must have a price before creating a Cash Deal."
        )

    selling_price = Decimal(selling_price)

    # -------------------------------------------------
    # Create Cash Deal
    # -------------------------------------------------

    cash_deal = CashDeal.objects.create(

        # Source
        quote=quote,

        # Relationships
        customer=quote.customer,
        car=car,
        agent=quote.salesperson,

        # Customer snapshot
        customer_name=quote.customer_name,
        customer_mobile=quote.customer_mobile,

        # Vehicle snapshot
        vehicle_stock_id=car.stock_id,
        vehicle_make=car.make,
        vehicle_model=car.model,
        vehicle_variant=car.variant or "",
        vehicle_year=car.year,
        vehicle_colour=car.colour or "",
        vehicle_mileage=car.mileage,
        vehicle_chassis_number=car.chassis_number or "",
        vehicle_engine_number=car.engine_number or "",

        # Financial snapshot
        selling_price=selling_price,

        # Evaluation is not part of the Cash Deal calculation.
        # CashDeal model default is 0.00.

        # Initial payment state
        advance_amount=Decimal("0.00"),
        balance_amount=selling_price,

        # Initial status
        status=CashDeal.Status.BOOKED,
    )

    return cash_deal


def update_cash_deal_financials(
    *,
    cash_deal,
    advance_amount,
):
    selling_price = cash_deal.selling_price

    advance_amount = Decimal(advance_amount)

    if advance_amount < Decimal("0.00"):
        raise DjangoValidationError(
            "Advance amount cannot be negative."
        )

    if advance_amount > selling_price:
        raise DjangoValidationError(
            "Advance amount cannot be greater than the selling price."
        )

    balance_amount = (
        selling_price - advance_amount
    )

    cash_deal.advance_amount = advance_amount
    cash_deal.balance_amount = balance_amount

    # -------------------------------------------------
    # Status transition
    # -------------------------------------------------

    if balance_amount == Decimal("0.00"):
        cash_deal.status = CashDeal.Status.READY_FOR_DELIVERY

        if cash_deal.car:
            InventoryService.prepare_car_for_booking(
                car=cash_deal.car
            )

    elif advance_amount > Decimal("0.00"):
        cash_deal.status = CashDeal.Status.ADVANCE_RECEIVED

        InventoryService.prepare_car_for_reservation(
            car=cash_deal.car,
        )

    else:
        cash_deal.status = CashDeal.Status.BOOKED

    cash_deal.save(
        update_fields=[
            "advance_amount",
            "balance_amount",
            "status",
            "updated_at",
        ]
    )
    from progression.services import sync_progression_for_quote

    sync_progression_for_quote(
        quote_id=cash_deal.quote_id,
    )

    return cash_deal


# =========================================================
# CASH RECEIPT SERVICES
# =========================================================

from datetime import date
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import CashReceipt
from quotes.models import Quote


CASH_RECEIPT_SEQUENCE_NAME = "cash_receipt"
CASH_RECEIPT_NUMBER_PREFIX = "CR"

STANDARD_CASH_RECEIPT_CATEGORIES = {
    "advance",
    "final_payment",
    "additional_payment",
    "down_payment",
    "evaluation",
    "bank_processing",
    "rta_passing",
    "registration",
    "insurance",
    "service_package",
    "warranty_service_contract",
    "export_transfer",
    "other",
}
# =========================================================
# RECEIPT NUMBER
# =========================================================

def generate_cash_receipt_number():
    """
    Generate a collision-safe Cash Receipt number.

    Uses the existing QuoteSequence infrastructure with
    a dedicated sequence name so Cash Receipt numbering
    remains independent from Quote numbering.

    Examples:
        CR-000001
        CR-000002
        CR-000003
    """
    # Import lazily to avoid unnecessary module coupling
    # at import time.
    from quotes.models import QuoteSequence

    with transaction.atomic():
        sequence, _ = (
            QuoteSequence.objects
            .select_for_update()
            .get_or_create(
                name=CASH_RECEIPT_SEQUENCE_NAME,
                defaults={
                    "current_number": 0,
                },
            )
        )

        sequence.current_number += 1

        sequence.save(
            update_fields=["current_number"],
        )

        return (
            f"{CASH_RECEIPT_NUMBER_PREFIX}-"
            f"{sequence.current_number:06d}"
        )


def validate_cash_receipt_category(category):
    category = str(category).strip()

    standard_categories = {
        choice[0]
        for choice in CashReceipt.Category.choices
    }

    if category in standard_categories:
        return category

    from finance.models import ExpensePreset, EmiExpense

    if ExpensePreset.objects.filter(
        expense_type__iexact=category,
        is_active=True,
    ).exists():
        return category

    if EmiExpense.objects.filter(
        expense_type__iexact=category,
    ).exists():
        return category

    raise ValidationError("Invalid Cash Receipt category.")
# =========================================================
# CASH RECEIPT VALIDATION
# =========================================================

def validate_cash_receipt_transaction(
    *,
    customer,
    quote,
    car,
    direction,
    category,
    amount,
    description="",
    payment_method=None,
    transaction_date=None,
):
    """
    Validate the business relationships and values for a
    Cash Receipt before persistence.
    """

    # -----------------------------------------------------
    # Customer
    # -----------------------------------------------------

    if customer is None:
        raise ValidationError(
            {"customer": "Customer is required."}
        )

    # -----------------------------------------------------
    # Quote / Deal
    # -----------------------------------------------------

    if quote is None:
        raise ValidationError(
            {"quote": "Deal / Quote is required."}
        )

    # -----------------------------------------------------
    # Customer ↔ Quote consistency
    # -----------------------------------------------------

    if quote.customer_id != customer.id:
        raise ValidationError(
            {
                "quote":
                    "The selected Quote does not belong "
                    "to the selected Customer."
            }
        )

    # -----------------------------------------------------
    # Vehicle consistency
    # -----------------------------------------------------

    if car is not None:
        expected_car_id = quote.car_id

        if (
            expected_car_id is None
            and quote.payment_method == Quote.PaymentMethod.FINANCE
        ):
            bank_loan = (
                BankLoan.objects
                .filter(
                    quote=quote,
                    status=BankLoan.Status.APPROVED,
                )
                .order_by("-updated_at", "-id")
                .first()
            )

            if bank_loan is not None:
                expected_car_id = bank_loan.car_id

        if expected_car_id != car.id:
            raise ValidationError(
                {
                    "car":
                        "The selected vehicle does not belong "
                        "to the selected Quote."
                }
            )

    # -----------------------------------------------------
    # Direction
    # -----------------------------------------------------

    valid_directions = {
        choice[0]
        for choice in CashReceipt.Direction.choices
    }

    if direction not in valid_directions:
        raise ValidationError(
            {
                "direction":
                    "Invalid Cash Receipt direction."
            }
        )

    # -----------------------------------------------------
    # Category
    # -----------------------------------------------------

    category = validate_cash_receipt_category(category)

    # -----------------------------------------------------
    # Payment method
    # -----------------------------------------------------

    valid_payment_methods = {
        choice[0]
        for choice in CashReceipt.PaymentMethod.choices
    }

    if payment_method not in valid_payment_methods:
        raise ValidationError(
            {
                "payment_method":
                    "Invalid Cash Receipt payment method."
            }
        )

    # -----------------------------------------------------
    # Amount
    # -----------------------------------------------------

    if amount is None:
        raise ValidationError(
            {"amount": "Amount is required."}
        )

    amount = Decimal(amount)

    if amount <= Decimal("0.00"):
        raise ValidationError(
            {"amount": "Amount must be greater than zero."}
        )

    # -----------------------------------------------------
    # Other category
    # -----------------------------------------------------

    if (
        category == CashReceipt.Category.OTHER
        and not (description or "").strip()
    ):
        raise ValidationError(
            {
                "description":
                    "Description is required when category is Other."
            }
        )

    # -----------------------------------------------------
    # Normalize date
    # -----------------------------------------------------

    if transaction_date is None:
        transaction_date = timezone.localdate()

    if not isinstance(transaction_date, date):
        raise ValidationError(
            {
                "transaction_date":
                    "Invalid transaction date."
            }
        )

    return {
        "amount": amount,
        "transaction_date": transaction_date,
    }

# =========================================================
# CASH DEAL PAYMENT SYNC
# =========================================================

CASH_DEAL_PAYMENT_CATEGORIES = {
    CashReceipt.Category.ADVANCE,
    CashReceipt.Category.DOWN_PAYMENT,
    CashReceipt.Category.ADDITIONAL_PAYMENT,
    CashReceipt.Category.FINAL_PAYMENT,
}


def sync_cash_deal_from_receipts(*, quote):
    """
    Rebuild the Cash Deal payment state from actual customer
    payment receipts belonging to the Quote.

    Cash Receipt is the authoritative transaction record.
    """

    cash_deal = (
        CashDeal.objects
        .select_for_update()
        .filter(quote_id=quote.id)
        .first()
    )

    if cash_deal is None:
        return None

    receipts = (
        CashReceipt.objects
        .filter(
            quote_id=quote.id,
            category__in=CASH_DEAL_PAYMENT_CATEGORIES,
        )
        .select_related(
            "reversal_of",
        )
    )

    total_received = ZERO

    for receipt in receipts:
        if receipt.reversal_of_id:
            original = receipt.reversal_of

            if original.direction == (
                CashReceipt.Direction.CUSTOMER_PAYMENT
            ):
                total_received -= receipt.amount

            continue

        if receipt.direction == (
            CashReceipt.Direction.CUSTOMER_PAYMENT
        ):
            total_received += receipt.amount

    return update_cash_deal_financials(
        cash_deal=cash_deal,
        advance_amount=total_received,
    )
# =========================================================
# CREATE CASH RECEIPT
# =========================================================

@transaction.atomic
def create_cash_receipt(
    *,
    customer,
    quote,
    car=None,
    quote_expense=None,
    emi_expense=None,
    direction,
    category,
    amount,
    payment_method,
    description="",
    transaction_date=None,
    reference="",
    created_by=None,
):
    """
    Create one historical Cash Receipt.

    This records an actual financial movement.
    Previous receipts are never overwritten.
    """

    # -----------------------------------------------------
    # Created by
    # -----------------------------------------------------

    if created_by is None:
        raise ValidationError(
            {
                "created_by":
                    "Created by is required."
            }
        )

    # -----------------------------------------------------
# Vehicle default
# -----------------------------------------------------

    if (
        car is None
        and quote.payment_method == Quote.PaymentMethod.FINANCE
    ):
        bank_loan = (
            BankLoan.objects
            .filter(
                quote=quote,
                status=BankLoan.Status.APPROVED,
            )
            .select_related("car")
            .order_by("-updated_at", "-id")
            .first()
        )

        if bank_loan is not None:
            car = bank_loan.car

    if car is None:
        car = quote.car

    if car is None:
        emi_sheet = getattr(quote, "emi_sheet", None)
        if emi_sheet is not None:
            car = emi_sheet.car
    # -----------------------------------------------------
    # Validate
    # -----------------------------------------------------

    validated = validate_cash_receipt_transaction(
        customer=customer,
        quote=quote,
        car=car,
        direction=direction,
        category=category,
        amount=amount,
        description=description,
        payment_method=payment_method,
        transaction_date=transaction_date,
    )

    # -----------------------------------------------------
    # Historical transaction number
    # -----------------------------------------------------

    receipt_number = generate_cash_receipt_number()
    category = validate_cash_receipt_category(category)

    if quote_expense and emi_expense:
        raise ValidationError(
            "Only one expense context can be linked to a cash receipt."
        )

    if quote_expense:
        if quote_expense.quote_id != quote.id:
            raise ValidationError(
                "Selected QuoteExpense does not belong to the selected quote."
            )

        if quote_expense.expense_type.lower() != category.lower():
            raise ValidationError(
                "Receipt category does not match the selected QuoteExpense."
            )

    if emi_expense:
        if not quote.emi_sheet_id:
            raise ValidationError(
                "The selected quote does not have an EMI sheet."
            )

        if emi_expense.emi_sheet_id != quote.emi_sheet_id:
            raise ValidationError(
                "Selected EmiExpense does not belong to the quote's EMI sheet."
            )

        if emi_expense.expense_type.lower() != category.lower():
            raise ValidationError(
                "Receipt category does not match the selected EmiExpense."
            )
    # -----------------------------------------------------
    # Create actual transaction
    # -----------------------------------------------------

    cash_receipt = CashReceipt.objects.create(
        receipt_number=receipt_number,

        customer=customer,
        quote=quote,
        car=car,
        quote_expense=quote_expense,
        emi_expense=emi_expense,

        direction=direction,
        category=category,
        amount=validated["amount"],
        payment_method=payment_method,

        description=(description or "").strip(),
        reference=(reference or "").strip(),

        transaction_date=validated["transaction_date"],

        # Actual source is this Cash Receipt record.
        source="cash_receipt",

        created_by=created_by,
    )
    if (
        direction == CashReceipt.Direction.CUSTOMER_PAYMENT
        and category in CASH_DEAL_PAYMENT_CATEGORIES
    ):
        cash_deal = sync_cash_deal_from_receipts(
            quote=quote,
        )

        if (
            cash_deal is None
            and category == CashReceipt.Category.ADVANCE
        ):
            from progression.services import (
                sync_progression_for_quote,
            )

            sync_progression_for_quote(
                quote_id=quote.id,
            )

    # -----------------------------------------------------
    # Finance Bank Loan Approved Amount → Balance Sheet
    # -----------------------------------------------------

    if (
        direction == CashReceipt.Direction.CUSTOMER_PAYMENT
        and category == CashReceipt.Category.OTHER
        and quote.payment_method == Quote.PaymentMethod.FINANCE
    ):
        approved_bank_loan = (
            BankLoan.objects
            .filter(
                quote=quote,
                status=BankLoan.Status.APPROVED,
            )
            .order_by("-updated_at", "-id")
            .first()
        )

        if (
            approved_bank_loan is not None
            and approved_bank_loan.approved_finance is not None
            and validated["amount"] ==
                approved_bank_loan.approved_finance
        ):
            if not BalanceSheet.objects.filter(
                quote_id=quote.id
            ).exists():
                create_balance_sheet(
                    customer=customer,
                    quote=quote,
                    created_by=created_by,
                )

    return cash_receipt

@transaction.atomic
def reverse_cash_receipt(
    receipt,
    created_by,
    description="",
    reference="",
):
    if receipt is None:
        raise DjangoValidationError(
            "Cash Receipt is required."
        )

    if created_by is None:
        raise DjangoValidationError(
            "Created by user is required."
        )

    if receipt.reversal_of_id is not None:
        raise DjangoValidationError(
            "A reversal transaction cannot itself be reversed."
        )

    if hasattr(receipt, "reversal"):
        raise DjangoValidationError(
            "This Cash Receipt has already been reversed."
        )

    reversed_direction = (
        CashReceipt.Direction.COMPANY_ON_BEHALF
        if receipt.direction
        == CashReceipt.Direction.CUSTOMER_PAYMENT
        else CashReceipt.Direction.CUSTOMER_PAYMENT
    )

    reversal_description = (
        description.strip()
        if description
        else ""
    )

    if not reversal_description:
        reversal_description = (
            f"Reversal of {receipt.receipt_number}"
        )

    reversal_reference = (
        reference.strip()
        if reference
        else ""
    )

    if not reversal_reference:
        reversal_reference = (
            f"Reversal of {receipt.receipt_number}"
        )

    reversal = create_cash_receipt(
        customer=receipt.customer,
        quote=receipt.quote,
        car=receipt.car,
        quote_expense=receipt.quote_expense,
        emi_expense=receipt.emi_expense,
        direction=reversed_direction,
        category=receipt.category,
        amount=receipt.amount,
        payment_method=receipt.payment_method,
        description=reversal_description,
        reference=reversal_reference,
        transaction_date=timezone.localdate(),
        created_by=created_by,
    )

    reversal.reversal_of = receipt
    reversal.source = "cash_receipt_reversal"

    reversal.save(
        update_fields=[
            "reversal_of",
            "source",
            "updated_at",
        ]
    )

    if receipt.quote_id:
        sync_cash_deal_from_receipts(
            quote=receipt.quote,
        )

    return reversal
# =========================================================
# BALANCE SHEET
# =========================================================

def validate_balance_sheet_creation(
    *,
    customer,
    quote,
):
    if customer is None:
        raise DjangoValidationError(
            {
                "customer": "Customer is required.",
            }
        )

    if quote is None:
        raise DjangoValidationError(
            {
                "quote": "Quote/Deal is required.",
            }
        )

    if quote.customer_id != customer.id:
        raise DjangoValidationError(
            {
                "quote": (
                    "The selected Quote does not belong "
                    "to the selected Customer."
                ),
            }
        )

    if BalanceSheet.objects.filter(
        quote_id=quote.id
    ).exists():
        raise DjangoValidationError(
            {
                "quote": (
                    "A Balance Sheet already exists "
                    "for this Quote/Deal."
                ),
            }
        )

    return True


@transaction.atomic
def create_balance_sheet(
    *,
    customer,
    quote,
    created_by,
):
    if created_by is None:
        raise DjangoValidationError(
            {
                "created_by": "Created by is required.",
            }
        )

    validate_balance_sheet_creation(
        customer=customer,
        quote=quote,
    )

    car = quote.car

    if (
        car is None
        and quote.payment_method == Quote.PaymentMethod.FINANCE
    ):
        bank_loan = (
            BankLoan.objects
            .filter(
                quote=quote,
                status=BankLoan.Status.APPROVED,
            )
            .select_related("car")
            .order_by("-updated_at", "-id")
            .first()
        )

        if bank_loan is not None:
            car = bank_loan.car

    if car is None:
        emi_sheet = getattr(quote, "emi_sheet", None)

        if emi_sheet is not None:
            car = emi_sheet.car

    return BalanceSheet.objects.create(
        customer=customer,
        quote=quote,
        car=car,
        created_by=created_by,
    )

@transaction.atomic
def update_balance_sheet_as_master(
    *,
    balance_sheet,
    master_overrides,
):
    if balance_sheet is None:
        raise DjangoValidationError(
            "Balance Sheet is required."
        )

    if not isinstance(master_overrides, dict):
        raise DjangoValidationError(
            {
                "master_overrides": (
                    "Master overrides must be a JSON object."
                )
            }
        )

    current_overrides = (
        balance_sheet.master_overrides
        or {}
    )

    updated_overrides = {
        **current_overrides,
        **master_overrides,
    }

    balance_sheet.master_overrides = (
        updated_overrides
    )

    balance_sheet.save(
        update_fields=[
            "master_overrides",
            "updated_at",
        ]
    )

    return balance_sheet