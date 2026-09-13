from django.core.exceptions import ValidationError as DjangoValidationError
from datetime import date, datetime
from finance.models import BankLoan, CashDeal
from quotes.models import Quote
from .models import Insurance
from django.db import transaction, models


def resolve_eligible_deal(
    *,
    quote,
    bank_loan=None,
    cash_deal=None,
):
    """
    Resolve the authoritative downstream transaction for Insurance.

    Finance:
        BankLoan must belong to the Quote and be approved.

    Cash:
        CashDeal must belong to the Quote and have an advance received.
    """
    if quote.status != Quote.Status.BOOKED:
        raise DjangoValidationError(
            "Insurance is only available for a booked Quote."
        )

    # -------------------------------------------------
    # FINANCE
    # -------------------------------------------------
    if quote.payment_method == Quote.PaymentMethod.FINANCE:
        if bank_loan is None:
            bank_loan = (
            BankLoan.objects
            .filter(
                quote=quote,
                status=BankLoan.Status.APPROVED,
            )
            .order_by("-updated_at", "-created_at")
            .first()
        )

        if bank_loan is None:
            raise DjangoValidationError(
                "Insurance is only available after the Bank Loan is approved."
            )

        if bank_loan.quote_id != quote.id:
            raise DjangoValidationError(
                "Bank Loan does not belong to this Quote."
            )

        if bank_loan.status != BankLoan.Status.APPROVED:
            raise DjangoValidationError(
                "Insurance is only available after the Bank Loan is approved."
            )

        return {
            "payment_method": Quote.PaymentMethod.FINANCE,
            "quote": quote,
            "bank_loan": bank_loan,
            "cash_deal": None,
        }

    # -------------------------------------------------
    # CASH
    # -------------------------------------------------
    if quote.payment_method == Quote.PaymentMethod.CASH:
        if cash_deal is None:
            try:
                cash_deal = CashDeal.objects.get(
                    quote=quote,
                )
            except CashDeal.DoesNotExist:
                raise DjangoValidationError(
                    "No Cash Deal exists for this Quote."
                )

        if cash_deal.quote_id != quote.id:
            raise DjangoValidationError(
                "Cash Deal does not belong to this Quote."
            )

        if cash_deal.advance_amount <= 0:
            raise DjangoValidationError(
                "Insurance is only available after an advance payment is received."
            )

        return {
            "payment_method": Quote.PaymentMethod.CASH,
            "quote": quote,
            "bank_loan": None,
            "cash_deal": cash_deal,
        }

    raise DjangoValidationError(
        "Insurance is not available for this payment method."
    )
    
def create_insurance(
    *,
    quote,
    user,
    bank_loan=None,
    cash_deal=None,
):
    """
    Create the initial Insurance record from the
    authoritative downstream transaction.
    """

    eligible = resolve_eligible_deal(
        quote=quote,
        bank_loan=bank_loan,
        cash_deal=cash_deal,
    )

    if hasattr(quote, "insurance"):
        raise DjangoValidationError(
            "Insurance already exists for this Quote."
        )

    bank_loan = eligible["bank_loan"]
    cash_deal = eligible["cash_deal"]

    # -------------------------------------------------
    # Finance source
    # -------------------------------------------------

    if bank_loan is not None:
        customer_name = bank_loan.customer_name
        customer_mobile = bank_loan.customer_mobile

        vehicle_stock_id = bank_loan.vehicle_stock_id
        vehicle_make = bank_loan.vehicle_make
        vehicle_model = bank_loan.vehicle_model
        vehicle_year = bank_loan.vehicle_year
        vehicle_colour = bank_loan.vehicle_colour
        vehicle_chassis_number = (
            bank_loan.vehicle_chassis_number
        )
        vehicle_engine_number = (
            bank_loan.vehicle_engine_number
        )
        vehicle_mileage = bank_loan.vehicle_mileage

    # -------------------------------------------------
    # Cash source
    # -------------------------------------------------

    else:
        customer_name = cash_deal.customer_name
        customer_mobile = cash_deal.customer_mobile

        vehicle_stock_id = cash_deal.vehicle_stock_id
        vehicle_make = cash_deal.vehicle_make
        vehicle_model = cash_deal.vehicle_model
        vehicle_year = cash_deal.vehicle_year
        vehicle_colour = cash_deal.vehicle_colour
        vehicle_chassis_number = (
            cash_deal.vehicle_chassis_number
        )
        vehicle_engine_number = (
            cash_deal.vehicle_engine_number
        )
        vehicle_mileage = cash_deal.vehicle_mileage

    return Insurance.objects.create(
        quote=quote,
        bank_loan=bank_loan,
        cash_deal=cash_deal,

        customer_name=customer_name,
        customer_mobile=customer_mobile,

        vehicle_stock_id=vehicle_stock_id,
        vehicle_make=vehicle_make,
        vehicle_model=vehicle_model,
        vehicle_year=vehicle_year,
        vehicle_colour=vehicle_colour,
        vehicle_chassis_number=vehicle_chassis_number,
        vehicle_engine_number=vehicle_engine_number,
        vehicle_mileage=vehicle_mileage,

        payment_method=eligible["payment_method"],

        application_status=Insurance.ApplicationStatus.APPLIED,

        created_by=user,
    )
    
@transaction.atomic
def update_insurance_status(
    *,
    insurance,
    application_status,
    policy_number=None,
    expiry_date=None,
):
    """
    Update Insurance application status using controlled transitions.
    """

    current_status = insurance.application_status

    allowed_transitions = {
        Insurance.ApplicationStatus.APPLIED: {
            Insurance.ApplicationStatus.DOCUMENTS_PENDING,
        },
        Insurance.ApplicationStatus.DOCUMENTS_PENDING: {
            Insurance.ApplicationStatus.APPROVED,
        },
        Insurance.ApplicationStatus.APPROVED: set(),
    }

    if application_status == current_status:
        return insurance

    if application_status not in allowed_transitions.get(
        current_status,
        set(),
    ):
        raise DjangoValidationError(
            "Invalid Insurance status transition."
        )

    if application_status == Insurance.ApplicationStatus.APPROVED:
        if not policy_number:
            raise DjangoValidationError(
                "Policy number is required for Insurance approval."
            )

        if not expiry_date:
            raise DjangoValidationError(
                "Expiry date is required for Insurance approval."
            )

        if isinstance(expiry_date, str):
            try:
                expiry_date = datetime.strptime(
                    expiry_date,
                    "%Y-%m-%d",
                ).date()
            except ValueError:
                raise DjangoValidationError(
                    "Expiry date must be in YYYY-MM-DD format."
                )

        insurance.policy_number = policy_number
        insurance.expiry_date = expiry_date

    insurance.application_status = application_status

    update_fields = [
        "application_status",
        "updated_at",
    ]

    if application_status == Insurance.ApplicationStatus.APPROVED:
        update_fields.extend(
            [
                "policy_number",
                "expiry_date",
            ]
        )

    insurance.save(
        update_fields=update_fields,
    )
    if application_status == Insurance.ApplicationStatus.APPROVED:
        create_initial_policy_cycle(insurance=insurance)

    return insurance

@transaction.atomic
def create_initial_policy_cycle(
    *,
    insurance,
):
    from .models import InsurancePolicy

    if insurance.application_status != (
        Insurance.ApplicationStatus.APPROVED
    ):
        raise DjangoValidationError(
            "Insurance must be approved before creating a policy cycle."
        )

    if not insurance.policy_number:
        raise DjangoValidationError(
            "Policy number is required."
        )

    if not insurance.expiry_date:
        raise DjangoValidationError(
            "Expiry date is required."
        )

    if insurance.policy_cycles.exists():
        return insurance.policy_cycles.order_by(
            "cycle_number"
        ).first()

    return InsurancePolicy.objects.create(
        insurance=insurance,
        cycle_number=1,
        policy_number=insurance.policy_number,
        start_date=insurance.created_at.date(),
        expiry_date=insurance.expiry_date,
        is_active=True,
    )
    
    
def get_policy_expiry_info(*, insurance):
    if not insurance.expiry_date:
        raise DjangoValidationError(
            "Insurance expiry date is not available."
        )

    days_remaining = (
        insurance.expiry_date - date.today()
    ).days

    if days_remaining > 30:
        expiry_status = "normal"
    elif days_remaining > 0:
        expiry_status = "renewal_priority"
    elif days_remaining == 0:
        expiry_status = "expiring_today"
    else:
        expiry_status = "expired"

    return {
        "days_remaining": days_remaining,
        "expiry_status": expiry_status,
    }
    
def is_renewal_eligible(*, insurance):
    expiry_info = get_policy_expiry_info(
        insurance=insurance,
    )

    return expiry_info["days_remaining"] <= 30

def start_insurance_renewal(*, insurance):
    if insurance.application_status != (
        Insurance.ApplicationStatus.APPROVED
    ):
        raise DjangoValidationError(
            "Insurance must be approved before renewal."
        )

    if not is_renewal_eligible(insurance=insurance):
        raise DjangoValidationError(
            "Insurance renewal is only available when the policy has 30 days or less remaining."
        )

    if insurance.renewal_status:
        raise DjangoValidationError(
            "Insurance renewal is already in progress or completed."
        )

    insurance.renewal_status = (
        Insurance.RenewalStatus.INFORMED_CUSTOMER
    )

    insurance.save(
        update_fields=[
            "renewal_status",
            "updated_at",
        ]
    )

    return insurance


def update_insurance_renewal_status(
    *,
    insurance,
    renewal_status,
):
    current_status = insurance.renewal_status

    allowed_transitions = {
        None: {
            Insurance.RenewalStatus.INFORMED_CUSTOMER,
        },
        Insurance.RenewalStatus.INFORMED_CUSTOMER: {
            Insurance.RenewalStatus.APPLIED_NEW,
        },
        Insurance.RenewalStatus.APPLIED_NEW: {
            Insurance.RenewalStatus.FOLLOW_UP,
        },
        Insurance.RenewalStatus.FOLLOW_UP: {
            Insurance.RenewalStatus.NOT_INTERESTED,
            Insurance.RenewalStatus.NEW_INSURANCE_APPROVED,
        },
        Insurance.RenewalStatus.NOT_INTERESTED: set(),
        Insurance.RenewalStatus.NEW_INSURANCE_APPROVED: set(),
    }

    if renewal_status == current_status:
        return insurance

    if renewal_status not in allowed_transitions.get(
        current_status,
        set(),
    ):
        raise DjangoValidationError(
            "Invalid Insurance renewal status transition."
        )

    insurance.renewal_status = renewal_status

    insurance.save(
        update_fields=[
            "renewal_status",
            "updated_at",
        ]
    )

    return insurance


@transaction.atomic
def approve_new_insurance(
    *,
    insurance,
    policy_number,
    expiry_date,
):
    from .models import InsurancePolicy

    if insurance.application_status != (
        Insurance.ApplicationStatus.APPROVED
    ):
        raise DjangoValidationError(
            "Insurance must be approved before approving a renewal."
        )

    if insurance.renewal_status != (
        Insurance.RenewalStatus.FOLLOW_UP
    ):
        raise DjangoValidationError(
            "Insurance renewal must be in Follow Up before approval."
        )

    if not policy_number:
        raise DjangoValidationError(
            "New policy number is required."
        )

    if not expiry_date:
        raise DjangoValidationError(
            "New expiry date is required."
        )
        
    if isinstance(expiry_date, str):
        try:
            expiry_date = datetime.strptime(
                expiry_date,
                "%Y-%m-%d",
            ).date()
        except ValueError:
            raise DjangoValidationError(
                "Expiry date must be in YYYY-MM-DD format."
            )

    active_policy = (
        insurance.policy_cycles
        .filter(is_active=True)
        .first()
    )

    if not active_policy:
        raise DjangoValidationError(
            "No active Insurance policy cycle exists."
        )
        
    next_cycle_number = (
        insurance.policy_cycles.aggregate(
            max_cycle=models.Max("cycle_number")
        )["max_cycle"] or 0
    ) + 1

    insurance.policy_cycles.filter(
        is_active=True,
    ).update(
        is_active=False,
    )

    new_policy = InsurancePolicy.objects.create(
        insurance=insurance,
        cycle_number=next_cycle_number,
        policy_number=policy_number,
        start_date=insurance.expiry_date,
        expiry_date=expiry_date,
        is_active=True,
    )

    insurance.policy_number = policy_number
    insurance.expiry_date = expiry_date
    insurance.renewal_status = (
        Insurance.RenewalStatus.NEW_INSURANCE_APPROVED
    )

    insurance.save(
        update_fields=[
            "policy_number",
            "expiry_date",
            "renewal_status",
            "updated_at",
        ]
    )

    return new_policy

def update_insurance_remark(
    *,
    insurance,
    remark,
):
    insurance.remark = (remark or "").strip()

    insurance.save(
        update_fields=[
            "remark",
            "updated_at",
        ]
    )

    return insurance