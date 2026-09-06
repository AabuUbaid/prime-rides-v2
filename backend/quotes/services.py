from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from finance.models import EmiSheet
from inventory.models import Car
from customers.services import create_customer

from .models import Quote, QuoteExpense, QuoteSequence


QUOTE_SEQUENCE_NAME = "quote"
QUOTE_NUMBER_PREFIX = "LEDGER"


# =========================================================
# QUOTE NUMBER
# =========================================================

def generate_quote_number():
    """
    Generate a collision-safe Quote number using a
    database-locked sequence row.

    Example:
        LEDGER-001
        LEDGER-002
        LEDGER-003
    """
    with transaction.atomic():
        sequence, _ = (
            QuoteSequence.objects
            .select_for_update()
            .get_or_create(
                name=QUOTE_SEQUENCE_NAME,
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
            f"{QUOTE_NUMBER_PREFIX}-"
            f"{sequence.current_number:03d}"
        )


# =========================================================
# HISTORICAL VEHICLE SNAPSHOT
# =========================================================

def snapshot_car_to_quote(
    *,
    quote,
    car,
):
    """
    Copy the current Inventory vehicle data into the
    Quote's historical vehicle snapshot.
    """
    quote.vehicle_stock_id = car.stock_id
    quote.vehicle_make = car.make
    quote.vehicle_model = car.model
    quote.vehicle_variant = car.variant
    quote.vehicle_year = car.year
    quote.vehicle_colour = car.colour
    quote.vehicle_mileage = car.mileage
    quote.vehicle_chassis_number = car.chassis_number
    quote.vehicle_engine_number = car.engine_number


# =========================================================
# HISTORICAL EMI SNAPSHOT
# =========================================================

def snapshot_emi_to_quote(
    *,
    quote,
    emi_sheet,
):
    """
    Copy historical vehicle and financial information
    from an existing EmiSheet into the Quote.

    This deliberately reads the saved EMI snapshot rather
    than recalculating Finance settings.
    """
    # -----------------------------------------------------
    # Historical vehicle snapshot
    # -----------------------------------------------------

    quote.vehicle_stock_id = emi_sheet.vehicle_stock_id
    quote.vehicle_make = emi_sheet.vehicle_make
    quote.vehicle_model = emi_sheet.vehicle_model
    quote.vehicle_variant = emi_sheet.vehicle_variant
    quote.vehicle_year = emi_sheet.vehicle_year
    quote.vehicle_colour = emi_sheet.vehicle_colour
    quote.vehicle_mileage = emi_sheet.vehicle_mileage

    quote.vehicle_chassis_number = (
        emi_sheet.vehicle_chassis_number
    )

    quote.vehicle_engine_number = (
        emi_sheet.vehicle_engine_number
    )

    if emi_sheet.customer is None:
        raise ValidationError(
            "The selected EMI is not associated with a Customer."
        )

    # -----------------------------------------------------
    # Historical customer snapshot
    # -----------------------------------------------------
    quote.customer = emi_sheet.customer
    quote.customer_name = emi_sheet.customer_name
    quote.customer_mobile = emi_sheet.customer_mobile
   

    # -----------------------------------------------------
    # Historical EMI / Finance snapshot
    # -----------------------------------------------------

    quote.emi_bank_name = emi_sheet.bank_name
    quote.emi_interest_rate = emi_sheet.interest_rate
    quote.emi_vehicle_price = emi_sheet.vehicle_price
    quote.emi_vat_enabled = emi_sheet.vat_enabled
    quote.emi_vat_amount = emi_sheet.vat_amount

    # Quote vehicle price is the Car Value (Evaluation)
    quote.price = emi_sheet.car_value_evaluation

    quote.down_payment =(
        emi_sheet.car_value_evaluation
        * Decimal("20")
        / Decimal("100")
    )
    quote.emi_down_payment = emi_sheet.down_payment
    quote.emi_finance_amount = emi_sheet.finance_amount
    quote.emi_expense_total = emi_sheet.expense_total
    quote.emi_tenure_years = emi_sheet.tenure_years
    quote.emi_total_interest = emi_sheet.total_interest
    quote.emi_total_payable = emi_sheet.total_payable
    quote.emi_monthly_emi = emi_sheet.monthly_emi


# =========================================================
# PAYMENT METHOD VALIDATION
# =========================================================

def validate_payment_method(payment_method):
    """
    Validate the Quote payment method.

    Allowed values:
        Cash
        Finance

    Blank is allowed because payment_method is optional
    in the current Quote workflow.
    """
    if payment_method in (
        None,
        "",
    ):
        return

    allowed_methods = {
        Quote.PaymentMethod.CASH,
        Quote.PaymentMethod.FINANCE,
    }

    if payment_method not in allowed_methods:
        raise ValidationError(
            "Invalid payment method. "
            "Allowed values are Cash and Finance."
        )
        
# =========================================================
# SOURCE / PAYMENT METHOD VALIDATION
# =========================================================

def validate_source_payment_method(
    *,
    source,
    payment_method,
):
    """
    Enforce the Quote source/payment relationship.

    Stock:
        Cash only

    Saved EMI:
        Finance only
    """

    if source == Quote.Source.STOCK:
        if payment_method != Quote.PaymentMethod.CASH:
            raise ValidationError(
                "Stock quotes must use Cash payment."
            )
        return

    if source == Quote.Source.SAVED_EMI:
        if payment_method != Quote.PaymentMethod.FINANCE:
            raise ValidationError(
                "Saved EMI quotes must use Finance payment."
            )
        return

    raise ValidationError(
        f"Unsupported quote source: {source}"
    )


# =========================================================
# SOURCE VALIDATION
# =========================================================

def validate_quote_source(
    *,
    source,
    car=None,
    emi_sheet=None,
):
    """
    Defense-in-depth validation for Quote source integrity.

    Stock:
        car required
        emi_sheet must be absent

    Saved EMI:
        emi_sheet required
        car must be absent
    """
    if source == Quote.Source.STOCK:
        if car is None:
            raise ValidationError(
                "A vehicle is required for a stock quote."
            )

        if emi_sheet is not None:
            raise ValidationError(
                "An EMI sheet cannot be supplied for a stock quote."
            )

        return

    if source == Quote.Source.SAVED_EMI:
        if emi_sheet is None:
            raise ValidationError(
                "An EMI sheet is required for a saved EMI quote."
            )

        if car is not None:
            raise ValidationError(
                "A car cannot be supplied for a saved EMI quote."
            )

        return

    raise ValidationError(
        f"Unsupported quote source: {source}"
    )


# =========================================================
# RESERVED VEHICLE VALIDATION
# =========================================================

def validate_stock_vehicle_for_quote(
    car,
):
    """
    Prevent creation of a stock Quote for a Reserved vehicle.

    This validation applies only to stock-based Quotes.
    Saved EMI Quotes may have car=None because Finance supports
    manual-vehicle EMI sheets.
    """
    if car is None:
        return

    if car.status == Car.Status.RESERVED:
        raise ValidationError(
            "Reserved vehicles cannot be used to create a Quote."
        )


# =========================================================
# STATUS TRANSITIONS
# =========================================================

ALLOWED_STATUS_TRANSITIONS = {
    Quote.Status.QUOTE: {
        Quote.Status.BOOKED,
        Quote.Status.SOLD,
        Quote.Status.CANCELLED,
    },

    Quote.Status.BOOKED: {
        Quote.Status.SOLD,
        Quote.Status.CANCELLED,
    },

    Quote.Status.SOLD: set(),

    Quote.Status.CANCELLED: set(),
}


def validate_status_transition(
    current_status,
    new_status,
):
    """
    Validate the allowed Quote lifecycle transitions.

    Allowed:
        Quote   -> Booked
        Quote   -> Sold
        Quote   -> Cancelled
        Booked  -> Sold
        Booked  -> Cancelled

    No transitions are allowed out of:
        Sold
        Cancelled

    Re-saving the same status is allowed.
    """
    if current_status == new_status:
        return

    allowed = ALLOWED_STATUS_TRANSITIONS.get(
        current_status,
        set(),
    )

    if new_status not in allowed:
        raise ValidationError(
            f"Cannot change Quote status from "
            f"{current_status} to {new_status}."
        )


# =========================================================
# QUOTE EXPENSES
# =========================================================

def create_quote_expenses(
    *,
    quote,
    expenses=None,
):
    """
    Create internal QuoteExpense records.

    `expenses` is expected to be an iterable of dictionaries,
    for example:

        [
            {
                "expense_type": "evaluation",
                "name": "Evaluation",
                "description": "",
                "estimated_min": Decimal("1000.00"),
                "estimated_max": Decimal("1200.00"),
                "actual_amount": None,
                "applies": True,
            }
        ]

    This function stores the supplied quotation-stage
    information. It does not perform Finance calculations.
    """
    if not expenses:
        return []

    created_expenses = []

    for expense_data in expenses:
        created_expenses.append(
            QuoteExpense.objects.create(
                quote=quote,
                expense_type=expense_data["expense_type"],
                name=expense_data["name"],
                description=expense_data.get(
                    "description",
                    "",
                ),
                estimated_min=expense_data.get(
                    "estimated_min",
                ),
                estimated_max=expense_data.get(
                    "estimated_max",
                ),
                actual_amount=expense_data.get(
                    "actual_amount",
                ),
                applies=expense_data.get(
                    "applies",
                    True,
                ),
            )
        )

    return created_expenses


# =========================================================
# CREATE QUOTE
# =========================================================

@transaction.atomic
def create_quote(
    *,
    source,
    customer_name,
    customer_mobile,
    price,
    payment_method="",
    extra_down_payment=Decimal("0.00"),
    deposit_date=None,
    car=None,
    emi_sheet=None,
    salesperson=None,
    expenses=None,
):
    """
    Create a Quote and establish its historical snapshot.

    This function is the main service entry point for Quote
    creation. API views should call this service instead of
    containing business logic themselves.
    """

    # -----------------------------------------------------
    # Validate source first
    # -----------------------------------------------------

    validate_quote_source(
        source=source,
        car=car,
        emi_sheet=emi_sheet,
    )

    # -----------------------------------------------------
    # Validate payment method
    # -----------------------------------------------------

    validate_payment_method(
        payment_method,
    )
    
    validate_source_payment_method(
        source=source,
        payment_method=payment_method,
    )

    # -----------------------------------------------------
    # Stock-specific validation
    # -----------------------------------------------------

    if source == Quote.Source.STOCK:
        validate_stock_vehicle_for_quote(
            car,
        )

    # -----------------------------------------------------
    # Resolve Customer
    # -----------------------------------------------------

    customer_result = create_customer(
        customer_name=customer_name,
        phone_number=customer_mobile,
        agent=None,
    )

    customer = customer_result["customer"]

    # -----------------------------------------------------
    # Generate backend-controlled Quote number
    # -----------------------------------------------------

    quote_number = generate_quote_number()


    # -----------------------------------------------------
    # Resolve Customer for stock Quote
    # -----------------------------------------------------

    customer = None

    if source == Quote.Source.STOCK:
        customer_result = create_customer(
            customer_name=customer_name,
            phone_number=customer_mobile,
            agent=None,
        )
        customer = customer_result["customer"]

    # -----------------------------------------------------
    # Create base Quote
    # -----------------------------------------------------

    quote = Quote(
        quote_number=quote_number,
        source=source,

        car=car,
        emi_sheet=emi_sheet,

        customer=customer,

        customer_name=customer_name,
        customer_mobile=customer_mobile,

        salesperson=salesperson,

        price=price,
        payment_method=payment_method,

        extra_down_payment=extra_down_payment,
        deposit_date=deposit_date,

        status=Quote.Status.QUOTE,
    )

    # -----------------------------------------------------
    # Historical snapshot
    # -----------------------------------------------------

    if source == Quote.Source.STOCK:
        snapshot_car_to_quote(
            quote=quote,
            car=car,
        )

    elif source == Quote.Source.SAVED_EMI:
        snapshot_emi_to_quote(
            quote=quote,
            emi_sheet=emi_sheet,
        )

    # -----------------------------------------------------
    # Save Quote
    # -----------------------------------------------------

    quote.save()

    # -----------------------------------------------------
    # Create internal expenses
    # -----------------------------------------------------

    create_quote_expenses(
        quote=quote,
        expenses=expenses,
    )

    return quote


# =========================================================
# UPDATE QUOTE
# =========================================================

@transaction.atomic
def update_quote(
    *,
    quote,
    salesperson=None,
    extra_down_payment=None,
    deposit_date=None,
    status=None,
    expense_updates=None,
):
    """
    Update only explicitly editable Quote fields.

    Historical/source fields are intentionally excluded.

    Editable fields:
        salesperson
        extra_down_payment
        deposit_date
        status
        expense actual_amount / applies
    """

    # -----------------------------------------------------
    # Status
    # -----------------------------------------------------

    if status is not None and status != quote.status:
        validate_status_transition(
            quote.status,
            status,
        )

        quote.status = status

    # -----------------------------------------------------
    # Salesperson
    # -----------------------------------------------------

    if salesperson is not None:
        quote.salesperson = salesperson

    # -----------------------------------------------------
    # Deposit
    # -----------------------------------------------------

    if extra_down_payment is not None:
        quote.extra_down_payment = extra_down_payment

    if deposit_date is not None:
        quote.deposit_date = deposit_date

    # -----------------------------------------------------
    # Save Quote only after applying changes
    # -----------------------------------------------------

    quote.save()

    # -----------------------------------------------------
    # Expense actual-value updates
    # -----------------------------------------------------

    if expense_updates:
        for expense_data in expense_updates:
            expense_id = expense_data["id"]

            try:
                expense = (
                    QuoteExpense.objects.get(
                        id=expense_id,
                        quote=quote,
                    )
                )
            except QuoteExpense.DoesNotExist:
                raise ValidationError(
                    f"Quote expense {expense_id} "
                    "does not belong to this Quote."
                )

            if "actual_amount" in expense_data:
                expense.actual_amount = (
                    expense_data["actual_amount"]
                )

            if "applies" in expense_data:
                expense.applies = (
                    expense_data["applies"]
                )

            expense.save()

    return quote