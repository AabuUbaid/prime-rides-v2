from decimal import Decimal, ROUND_HALF_UP
from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError
from inventory.models import Car
from . import selectors
from .models import Bank, EmiExpense, EmiSheet, EmiSequence


@transaction.atomic
def create_bank(
    *,
    name,
    interest_rate,
    is_cash=False,
    is_active=True,
):
    """
    Create a new bank.
    """

    name = str(name).strip()

    if not name:
        raise ValidationError(
            "Bank name is required."
        )

    if interest_rate is None:
        raise ValidationError(
            "Interest rate is required."
        )

    interest_rate = Decimal(
        str(interest_rate)
    )

    if interest_rate < 0:
        raise ValidationError(
            "Interest rate cannot be negative."
        )

    # Cash must always have 0% interest.
    if is_cash:
        interest_rate = Decimal(
            "0.00"
        )

    if Bank.objects.filter(
        name__iexact=name
    ).exists():
        raise ValidationError(
            "A bank with this name already exists."
        )
    
    try:
        return Bank.objects.create(
            name=name,
            interest_rate=interest_rate,
            is_cash=is_cash,
            is_active=is_active,
        )
    except IntegrityError:
        raise ValidationError(
            "A bank with this name already exists."
        )


@transaction.atomic
def update_bank(
    *,
    bank,
    name=None,
    interest_rate=None,
    is_cash=None,
    is_active=None,
):
    """
    Update an existing bank.
    """

    if name is not None:

        name = str(name).strip()

        if not name:
            raise ValidationError(
                "Bank name is required."
            )

        duplicate_exists = (
            Bank.objects
            .filter(name__iexact=name)
            .exclude(pk=bank.pk)
            .exists()
        )

        if duplicate_exists:
            raise ValidationError(
                "A bank with this name already exists."
            )

        bank.name = name

    if is_cash is not None:
        bank.is_cash = is_cash

    if interest_rate is not None:

        interest_rate = Decimal(
            str(interest_rate)
        )

        if interest_rate < 0:
            raise ValidationError(
                "Interest rate cannot be negative."
            )

        bank.interest_rate = interest_rate

    # Cash must always be 0%.
    if bank.is_cash:
        bank.interest_rate = Decimal(
            "0.00"
        )

    if is_active is not None:
        bank.is_active = is_active

    bank.save()

    return bank


@transaction.atomic
def activate_bank(
    *,
    bank,
):
    """
    Activate a bank.
    """

    bank.is_active = True
    bank.save(
        update_fields=[
            "is_active",
            "updated_at",
        ]
    )

    return bank


@transaction.atomic
def deactivate_bank(
    *,
    bank,
):
    """
    Deactivate a bank.

    Existing EMI sheets are not modified.
    """

    bank.is_active = False

    bank.save(
        update_fields=[
            "is_active",
            "updated_at",
        ]
    )

    return bank







MONEY_QUANTIZER = Decimal("0.01")


def _money(value):
    """
    Convert a value to Decimal and round it
    to two decimal places.
    """

    return Decimal(
        str(value)
    ).quantize(
        MONEY_QUANTIZER,
        rounding=ROUND_HALF_UP,
    )


def calculate_emi(
    *,
    vehicle_price,
    down_payment,
    tenure_years,
    bank_id,
    vat_enabled=False,
    manual_interest_rate=None,
):
    """
    Calculate an EMI using the Finance business rules.

    No database record is created here.

    Returns a dictionary containing all calculated
    values required by the frontend and save service.
    """

    # -------------------------------------------------
    # Normalize inputs
    # -------------------------------------------------

    vehicle_price = _money(
        vehicle_price
    )

    down_payment = _money(
        down_payment
    )

    # -------------------------------------------------
    # Basic validation
    # -------------------------------------------------

    if vehicle_price < 0:
        raise ValidationError(
            "Vehicle price cannot be negative."
        )

    if down_payment < 0:
        raise ValidationError(
            "Down payment cannot be negative."
        )

    if down_payment > vehicle_price:
        raise ValidationError(
            "Down payment cannot exceed vehicle price."
        )

    try:
        tenure_years = int(
            tenure_years
        )
    except (
        TypeError,
        ValueError,
    ):
        raise ValidationError(
            "Tenure must be a valid number."
        )

    if tenure_years <= 0:
        raise ValidationError(
            "Tenure must be greater than zero."
        )

    # -------------------------------------------------
    # Get bank
    # -------------------------------------------------

    try:
        bank = selectors.get_active_bank(
            bank_id
        )
    except Exception:
        raise ValidationError(
            "Selected bank does not exist or is inactive."
        )

    # -------------------------------------------------
    # VAT
    # -------------------------------------------------

    if vat_enabled:

        vat_amount = _money(
            vehicle_price
            * Decimal("0.05")
        )

        price_after_vat = _money(
            vehicle_price
            + vat_amount
        )

    else:

        vat_amount = Decimal(
            "0.00"
        )

        price_after_vat = vehicle_price

    # -------------------------------------------------
    # Finance principal
    # -------------------------------------------------

    if down_payment > price_after_vat:
        raise ValidationError(
            "Down payment cannot exceed "
            "price after VAT."
        )

    finance_amount = _money(
        price_after_vat
        - down_payment
    )

    # -------------------------------------------------
    # Interest rate
    # -------------------------------------------------

    if manual_interest_rate is not None:

        try:
            interest_rate = Decimal(
                str(
                    manual_interest_rate
                )
            )

        except Exception:
            raise ValidationError(
                "Interest rate must be valid."
            )

        if interest_rate < 0:
            raise ValidationError(
                "Interest rate cannot be negative."
            )

    else:

        interest_rate = Decimal(
            str(
                bank.interest_rate
            )
        )

    interest_rate = interest_rate.quantize(
        MONEY_QUANTIZER,
        rounding=ROUND_HALF_UP,
    )

    # -------------------------------------------------
    # Cash
    # -------------------------------------------------

    if bank.is_cash:

        interest_rate = Decimal(
            "0.00"
        )

        total_interest = Decimal(
            "0.00"
        )

        total_payable = finance_amount

        monthly_emi = Decimal(
            "0.00"
        )

    # -------------------------------------------------
    # Flat-rate EMI
    # -------------------------------------------------

    else:

        total_interest = _money(
            finance_amount
            * (
                interest_rate
                / Decimal("100")
            )
            * Decimal(
                tenure_years
            )
        )

        total_payable = _money(
            finance_amount
            + total_interest
        )

        total_months = (
            tenure_years * 12
        )

        monthly_emi = _money(
            total_payable
            / Decimal(
                total_months
            )
        )

    return {
        "vehicle_price": vehicle_price,
        "vat_enabled": vat_enabled,
        "vat_amount": vat_amount,
        "price_after_vat": price_after_vat,
        "down_payment": down_payment,
        "finance_amount": finance_amount,
        "tenure_years": tenure_years,
        "bank_id": bank.id,
        "bank_name": bank.name,
        "is_cash": bank.is_cash,
        "interest_rate": interest_rate,
        "total_interest": total_interest,
        "total_payable": total_payable,
        "monthly_emi": monthly_emi,
    }


def generate_emi_number():
    """
    Generate the next EMI number using a
    database-backed atomic counter.

    Format:
        EMI-000001
        EMI-000002
        EMI-000003
        ...
    """

    sequence = (
        EmiSequence.objects
        .select_for_update()
        .get(name="emi")
    )

    sequence.current_number += 1

    sequence.save(
        update_fields=[
            "current_number",
        ]
    )

    return (
        f"EMI-{sequence.current_number:06d}"
    )


@transaction.atomic
def create_emi_sheet(
    *,
    customer_name,
    customer_mobile,
    car_id=None,
    vehicle_price,
    vat_enabled=False,
    down_payment,
    tenure_years,
    bank_id,
    manual_interest_rate=None,
    expenses=None,
    manual_vehicle=None,
):
    """
    Create a complete EMI sheet.

    The calculation is performed server-side.
    The calculated values and vehicle/bank information
    are persisted as historical snapshots.
    """

    # -------------------------------------------------
    # Get vehicle
    # -------------------------------------------------

    car = None

    if car_id is not None:

        try:
            car = (
                Car.objects
                .select_for_update()
                .get(pk=car_id)
            )
        except Car.DoesNotExist:
            raise ValidationError(
                "Selected vehicle does not exist."
            )
# -------------------------------------------------
# Vehicle information / historical snapshot
# -------------------------------------------------

    if car:
        # Inventory vehicle snapshot
        vehicle_stock_id = car.stock_id
        vehicle_make = car.make
        vehicle_model = car.model
        vehicle_variant = car.variant
        vehicle_year = car.year
        vehicle_colour = car.colour
        vehicle_mileage = car.mileage
        vehicle_chassis_number = car.chassis_number
        vehicle_engine_number = car.engine_number

    else:
        # Manual vehicle snapshot
        vehicle_stock_id = ""
        vehicle_make = manual_vehicle["make"]
        vehicle_model = manual_vehicle["model"]
        vehicle_variant = manual_vehicle.get(
            "variant",
            "",
        )
        vehicle_year = manual_vehicle["year"]
        vehicle_colour = manual_vehicle["colour"]
        vehicle_mileage = manual_vehicle["mileage"]
        vehicle_chassis_number = (
            manual_vehicle["chassis_number"]
        )
        vehicle_engine_number = (
            manual_vehicle["engine_number"]
        )

    # -------------------------------------------------
    # Calculate EMI
    # -------------------------------------------------

    calculation = calculate_emi(
        vehicle_price=vehicle_price,
        down_payment=down_payment,
        tenure_years=tenure_years,
        bank_id=bank_id,
        vat_enabled=vat_enabled,
        manual_interest_rate=manual_interest_rate,
    )

    manual_rate_used = (
        manual_interest_rate is not None
        and not calculation["is_cash"]
    )

    # -------------------------------------------------
    # Get bank
    # -------------------------------------------------

    try:
        bank = selectors.get_active_bank(
            bank_id
        )
    except Bank.DoesNotExist:
        raise ValidationError(
            "Selected bank does not exist or is inactive."
        )

    # -------------------------------------------------
    # Generate EMI number
    # -------------------------------------------------

    emi_number = generate_emi_number()

    # -------------------------------------------------
    # Create EMI sheet
    # -------------------------------------------------

    emi_sheet = EmiSheet.objects.create(
        emi_number=emi_number,

        # Customer
        customer_name=customer_name.strip(),
        customer_mobile=customer_mobile.strip(),

        # Vehicle relation
        car=car,

        # Vehicle snapshot
        # Vehicle snapshot
        vehicle_stock_id=vehicle_stock_id,
        vehicle_make=vehicle_make,
        vehicle_model=vehicle_model,
        vehicle_variant=vehicle_variant,
        vehicle_year=vehicle_year,
        vehicle_colour=vehicle_colour,
        vehicle_mileage=vehicle_mileage,
        vehicle_chassis_number=vehicle_chassis_number,
        vehicle_engine_number=vehicle_engine_number,

        # Bank
        # Bank
        bank=bank,
        bank_name=calculation[
            "bank_name"
        ],
        manual_rate_used=manual_rate_used,
        interest_rate=calculation[
            "interest_rate"
        ],

        # Inputs
        vehicle_price=calculation[
            "vehicle_price"
        ],
        vat_enabled=calculation[
            "vat_enabled"
        ],
        vat_amount=calculation[
            "vat_amount"
        ],
        price_after_vat=calculation[
            "price_after_vat"
        ],
        down_payment=calculation[
            "down_payment"
        ],
        finance_amount=calculation[
            "finance_amount"
        ],
        tenure_years=calculation[
            "tenure_years"
        ],

        # Results
        total_interest=calculation[
            "total_interest"
        ],
        total_payable=calculation[
            "total_payable"
        ],
        monthly_emi=calculation[
            "monthly_emi"
        ],
    )

    # -------------------------------------------------
    # Create expenses
    # -------------------------------------------------

    expenses = expenses or []

    for expense in expenses:

        EmiExpense.objects.create(
            emi_sheet=emi_sheet,
            expense_type=expense[
                "expense_type"
            ],
            description=expense.get(
                "description",
                "",
            ).strip(),
            amount=expense[
                "amount"
            ],
        )

    return emi_sheet