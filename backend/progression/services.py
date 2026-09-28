from decimal import Decimal
from django.db.models import Sum
from django.utils import timezone
from inventory.models import Car
from inventory.services import InventoryService
from finance.models import (
    BalanceSheet,
    BankLoan,
    CashDeal,
    CashReceipt,
)

from insurance.models import Insurance
from django.db import transaction
from django.db.models import Sum
from rest_framework.exceptions import ValidationError
from insurance.services import create_insurance

from finance.models import (
    BankLoan,
    CashDeal,
    CashReceipt,
)
from quotes.models import Quote
from insurance.models import Insurance
from .models import (
    Progression,
    ProgressionOverrideAudit,
)


def _cash_advance_received(*, quote, cash_deal):
    if cash_deal.advance_amount <= Decimal("0.00"):
        return False

    payment_categories = {
        CashReceipt.Category.ADVANCE,
        CashReceipt.Category.DOWN_PAYMENT,
        CashReceipt.Category.ADDITIONAL_PAYMENT,
        CashReceipt.Category.FINAL_PAYMENT,
    }

    customer_payments = (
        CashReceipt.objects
        .filter(
            quote=quote,
            category__in=payment_categories,
            direction=CashReceipt.Direction.CUSTOMER_PAYMENT,
        )
        .aggregate(total=Sum("amount"))
        .get("total")
        or Decimal("0.00")
    )

    reversed_payments = (
        CashReceipt.objects
        .filter(
            quote=quote,
            category=CashReceipt.Category.ADVANCE,
            direction=CashReceipt.Direction.COMPANY_ON_BEHALF,
        )
        .aggregate(total=Sum("amount"))
        .get("total")
        or Decimal("0.00")
    )

    actual_received = customer_payments - reversed_payments

    return actual_received >= cash_deal.advance_amount


def _get_quote_or_raise(*, quote_id):
    try:
        return (
            Quote.objects
            .select_related(
                "customer",
                "car",
                "salesperson",
            )
            .get(pk=quote_id)
        )
    except Quote.DoesNotExist:
        raise ValidationError(
            "Quote/Deal not found."
        )


@transaction.atomic
def sync_progression_for_quote(*, quote_id):
    """
    Synchronize Progression activation with the
    existing commercial/financial source.

    Progression stores only its own workflow state and
    references the authoritative BankLoan/CashDeal source.

    Vehicle, seller, customer, bank, pricing, evaluation,
    and submitted-date display values are derived by the
    Progression serializer from those source records.
    """

    quote = (
        Quote.objects
        .select_related(
            "customer",
            "car",
            "salesperson",
        )
        .select_for_update(
            of=("self",)
        )
        .get(pk=quote_id)
    )

    progression = (
        Progression.objects
        .select_for_update()
        .filter(quote=quote)
        .first()
    )

    # -------------------------------------------------
    # FINANCE
    # -------------------------------------------------

    if quote.payment_method == Quote.PaymentMethod.FINANCE:
        latest_loan = (
            BankLoan.objects
            .filter(quote=quote)
            .order_by("-updated_at", "-id")
            .first()
        )

        approved_loan = (
            BankLoan.objects
            .filter(
                quote=quote,
                status=BankLoan.Status.APPROVED,
            )
            .order_by("-updated_at", "-id")
            .first()
        )

        # ---------------------------------------------
        # Approved Bank Loan → Active Progression
        # ---------------------------------------------

        if approved_loan is not None:
            progression_data = {
                "source_type": Progression.SourceType.FINANCE,
                "bank_loan": approved_loan,
                "cash_deal": None,
                "status": Progression.Status.ACTIVE,
            }

            if progression is None:
                return Progression.objects.create(
                    quote=quote,
                    current_stage=Progression.Stage.EVALUATION,
                    created_by=quote.salesperson,
                    **progression_data,
                )

            # Do not overwrite a completed progression.
            if progression.status != Progression.Status.COMPLETED:
                for field, value in progression_data.items():
                    setattr(
                        progression,
                        field,
                        value,
                    )

                progression.save(
                    update_fields=[
                        "source_type",
                        "bank_loan",
                        "cash_deal",
                        "status",
                        "updated_at",
                    ]
                )

            return progression

        # ---------------------------------------------
        # No Approved Loan → Inactive Progression
        # ---------------------------------------------

        if progression is not None:
            update_fields = []

            # Preserve the most recent loan as the
            # historical/source reference.
            if latest_loan is not None:
                progression.bank_loan = latest_loan
                update_fields.append("bank_loan")

            if progression.status != Progression.Status.COMPLETED:
                progression.status = Progression.Status.INACTIVE
                update_fields.append("status")

            if update_fields:
                progression.save(
                    update_fields=[
                        *update_fields,
                        "updated_at",
                    ]
                )

        return progression

    # -------------------------------------------------
# CASH
# -------------------------------------------------

    if quote.payment_method == Quote.PaymentMethod.CASH:
        cash_deal = (
            CashDeal.objects
            .filter(quote=quote)
            .first()
        )

        # Cash Deal does not exist yet.
        if cash_deal is None:
            return progression

        # Fully paid / ready for delivery.
        cash_ready_for_delivery = (
            cash_deal.balance_amount <= Decimal("0.00")
            or cash_deal.status == CashDeal.Status.READY_FOR_DELIVERY
        )

        # Partially paid Cash Deal requires an actual receipt.
        advance_received = _cash_advance_received(
            quote=quote,
            cash_deal=cash_deal,
        )

        if advance_received or cash_ready_for_delivery:
            progression_data = {
                "source_type": Progression.SourceType.CASH,
                "bank_loan": None,
                "cash_deal": cash_deal,
                "status": Progression.Status.ACTIVE,
            }

            if progression is None:
                return Progression.objects.create(
                    quote=quote,
                    current_stage=Progression.Stage.EVALUATION,
                    created_by=quote.salesperson,
                    **progression_data,
                )

            if progression.status != Progression.Status.COMPLETED:
                for field, value in progression_data.items():
                    setattr(
                        progression,
                        field,
                        value,
                    )

                progression.save(
                    update_fields=[
                        "source_type",
                        "bank_loan",
                        "cash_deal",
                        "status",
                        "updated_at",
                    ]
                )

            return progression

        # Cash Deal exists but is not financially active.
        if progression is not None:
            if progression.status != Progression.Status.COMPLETED:
                progression.cash_deal = cash_deal
                progression.status = Progression.Status.INACTIVE

                progression.save(
                    update_fields=[
                        "cash_deal",
                        "status",
                        "updated_at",
                    ]
                )

        return progression
    

    # -------------------------------------------------
    # UNSUPPORTED PAYMENT METHOD
    # -------------------------------------------------

    raise ValidationError(
        "Unsupported Quote payment method for Progression."
    )

def list_progressions(*, user):
    queryset = (
        Progression.objects
        .select_related(
            "quote",
            "quote__customer",
            "quote__car",
            "quote__salesperson",
            "quote__salesperson__staff_profile",
            "quote__emi_sheet",
            "bank_loan",
            "bank_loan__bank",
            "bank_loan__agent__staff_profile",
            "cash_deal",
            "cash_deal__agent__staff_profile",
        )
        .all()
    )

    if user.role == "SALES_STAFF":
        queryset = queryset.filter(
            quote__salesperson=user,
        )

    return queryset


def get_progression(*, pk, user):
    queryset = list_progressions(user=user)

    try:
        return queryset.get(pk=pk)
    except Progression.DoesNotExist:
        raise ValidationError(
            "Progression not found."
        )
        

def _balance_sheet_is_settled(*, quote):
    balance_sheet = (
        BalanceSheet.objects
        .filter(quote=quote)
        .first()
    )

    if balance_sheet is None:
        return False

    total_received = (
        CashReceipt.objects
        .filter(
            quote=quote,
            direction=CashReceipt.Direction.CUSTOMER_PAYMENT,
        )
        .aggregate(total=Sum("amount"))
        .get("total")
        or Decimal("0.00")
    )

    # Keep this calculation exactly aligned with
    # BalanceSheetSerializer.get_total_spent().
    if quote.payment_method == "Finance":
        total_spent = (
            getattr(
                quote,
                "emi_finance_amount",
                None,
            )
            or Decimal("0.00")
        )
    else:
        quote_amount = (
            getattr(
                quote,
                "price",
                None,
            )
            or Decimal("0.00")
        )

        company_on_behalf = (
            CashReceipt.objects
            .filter(
                quote=quote,
                direction=CashReceipt.Direction.COMPANY_ON_BEHALF,
            )
            .aggregate(total=Sum("amount"))
            .get("total")
            or Decimal("0.00")
        )

        total_spent = quote_amount + company_on_behalf

    return (
        total_received - total_spent
    ) == Decimal("0.00")
       
@transaction.atomic
def advance_progression_stage(
    *,
    progression,
    user,
    override_balance_gate=False,
    override_reason=None,
):
    """
    Advance an active Progression by exactly one valid stage.

    The stage transition is controlled by the backend state machine.
    The client cannot directly assign an arbitrary current_stage.

    Registration has a Balance Sheet gate:
    - Settled Balance Sheet → Registration → Delivery Video
    - Unsettled Balance Sheet → blocked
    - Master can override with a mandatory reason
    - Admin/SalesStaff cannot bypass the gate
    """

    # -------------------------------------------------
    # Lock only the Progression row.
    #
    # bank_loan and cash_deal are nullable, so they must
    # not be part of the FOR UPDATE join.
    # -------------------------------------------------

    progression = (
        Progression.objects
        .select_for_update(
            of=("self",)
        )
        .get(pk=progression.pk)
    )

    # Load related source data without row locking.
    progression = (
        Progression.objects
        .select_related(
            "quote",
            "bank_loan",
            "cash_deal",
        )
        .get(pk=progression.pk)
    )

    # -------------------------------------------------
    # Basic state validation
    # -------------------------------------------------

    if progression.status != Progression.Status.ACTIVE:
        raise ValidationError(
            "Only an active Progression can be advanced."
        )

    current_stage = progression.current_stage

    # -------------------------------------------------
    # EVALUATION
    #
    # Dubai:
    #   Evaluation → Passing
    #
    # Non-Dubai:
    #   Evaluation → Dubai Passing
    # -------------------------------------------------

    if current_stage == Progression.Stage.EVALUATION:
        if not progression.registration_emirate:
            raise ValidationError(
                "Registration emirate must be selected "
                "before Evaluation can be completed."
            )

        if (
            progression.registration_emirate
            == Progression.RegistrationEmirate.DUBAI
        ):
            progression.current_stage = (
                Progression.Stage.PASSING
            )
        else:
            progression.current_stage = (
                Progression.Stage.DUBAI_PASSING
            )

    # -------------------------------------------------
    # DUBAI PASSING
    #
    # Non-Dubai route:
    # Dubai Passing → Registration Emirate Passing
    # -------------------------------------------------

    elif (
        current_stage
        == Progression.Stage.DUBAI_PASSING
    ):
        if (
            not progression.registration_emirate
            or progression.registration_emirate
            == Progression.RegistrationEmirate.DUBAI
        ):
            raise ValidationError(
                "A non-Dubai registration emirate is required "
                "before completing Dubai Passing."
            )

        progression.current_stage = (
            Progression.Stage.REGISTRATION_PASSING
        )

    # -------------------------------------------------
    # REGISTRATION EMIRATE PASSING
    #
    # Non-Dubai route:
    # Registration Emirate Passing → Insurance
    # -------------------------------------------------

    elif (
        current_stage
        == Progression.Stage.REGISTRATION_PASSING
    ):
        progression.current_stage = (
            Progression.Stage.INSURANCE
        )

    # -------------------------------------------------
    # PASSING
    #
    # Dubai route:
    # Passing → Insurance
    #
    # Insurance is created through the existing
    # Insurance service using the authoritative source.
    # -------------------------------------------------

    elif current_stage == Progression.Stage.PASSING:
        try:
            insurance = progression.quote.insurance
        except Exception:
            insurance = None

        if insurance is None:
            if progression.source_type == (
                Progression.SourceType.FINANCE
            ):
                if progression.bank_loan is None:
                    raise ValidationError(
                        "Bank Loan source is required "
                        "before Insurance."
                    )

                create_insurance(
                    quote=progression.quote,
                    user=user,
                    bank_loan=progression.bank_loan,
                    cash_deal=None,
                )

            elif progression.source_type == (
                Progression.SourceType.CASH
            ):
                if progression.cash_deal is None:
                    raise ValidationError(
                        "Cash Deal source is required "
                        "before Insurance."
                    )

                create_insurance(
                    quote=progression.quote,
                    user=user,
                    bank_loan=None,
                    cash_deal=progression.cash_deal,
                )

            else:
                raise ValidationError(
                    "Invalid Progression source type."
                )

        progression.current_stage = (
            Progression.Stage.INSURANCE
        )

    # -------------------------------------------------
    # INSURANCE
    #
    # Insurance business logic itself remains inside
    # the Insurance module.
    #
    # Progression only verifies that:
    # 1. Insurance record exists
    # 2. Insurance application is APPROVED
    #
    # Once approved:
    # Insurance → Registration
    # -------------------------------------------------

    elif current_stage == Progression.Stage.INSURANCE:
        try:
            insurance = progression.quote.insurance
        except Exception:
            insurance = None

        if insurance is None:
            raise ValidationError(
                "Insurance record must exist before "
                "leaving the Insurance stage."
            )

        if (
            insurance.application_status
            != Insurance.ApplicationStatus.APPROVED
        ):
            raise ValidationError(
                "Insurance must be approved before "
                "Progression can move to Registration."
            )

        progression.current_stage = (
            Progression.Stage.REGISTRATION
        )

    # -------------------------------------------------
    # REGISTRATION
    #
    # Balance Sheet gate:
    #
    # Settled:
    #     Registration → Delivery Video
    #
    # Unsettled:
    #     Block transition
    #
    # Master override:
    #     Require reason
    #     Create audit record
    #     Registration → Delivery Video
    # -------------------------------------------------

    elif current_stage == Progression.Stage.REGISTRATION:
        balance_settled = _balance_sheet_is_settled(
            quote=progression.quote,
        )

        # ---------------------------------------------
        # Balance Sheet already settled
        # ---------------------------------------------

        if balance_settled:
            progression.current_stage = (
                Progression.Stage.DELIVERY_VIDEO
            )

        # ---------------------------------------------
        # Balance Sheet unsettled
        # ---------------------------------------------

        else:
            # Only Master can override.
            if override_balance_gate:
                if user.role != "MASTER":
                    raise ValidationError(
                        "Only Master can override the "
                        "Balance Sheet registration gate."
                    )

                if (
                    override_reason is None
                    or not override_reason.strip()
                ):
                    raise ValidationError(
                        "A reason is required when "
                        "overriding the Balance Sheet gate."
                    )

                previous_status = progression.status
                previous_stage = progression.current_stage

                progression.current_stage = (
                    Progression.Stage.DELIVERY_VIDEO
                )

                progression.save(
                    update_fields=[
                        "current_stage",
                        "updated_at",
                    ]
                )

                ProgressionOverrideAudit.objects.create(
                    progression=progression,
                    quote=progression.quote,
                    acted_by=user,
                    action="balance_sheet_registration_override",
                    reason=override_reason.strip(),
                    previous_status=previous_status,
                    new_status=progression.status,
                    previous_stage=previous_stage,
                    new_stage=progression.current_stage,
                )

                return progression

            raise ValidationError(
                "Balance Sheet must be settled before "
                "Registration can proceed."
            )

    # -------------------------------------------------
    # DELIVERY VIDEO
    #
    # Completion integration will be implemented here.
    # -------------------------------------------------

    elif current_stage == Progression.Stage.DELIVERY_VIDEO:
        # -------------------------------------------------
        # DELIVERY VIDEO → COMPLETED
        #
        # Final completion:
        # 1. Resolve the authoritative vehicle.
        # 2. Lock the vehicle for concurrency safety.
        # 3. Move vehicle Booked → Sold through InventoryService.
        # 4. Mark Progression Completed.
        # 5. Record completed_at.
        #
        # No independent financial/accounting record is
        # created here. Existing financial sources remain
        # authoritative.
        # -------------------------------------------------

        if progression.source_type == Progression.SourceType.FINANCE:
            if progression.bank_loan is None:
                raise ValidationError(
                    "Bank Loan source is required before Progression completion."
                )

            car = progression.bank_loan.car

        elif progression.source_type == Progression.SourceType.CASH:
            if progression.cash_deal is None:
                raise ValidationError(
                    "Cash Deal source is required before Progression completion."
                )

            car = progression.cash_deal.car

        else:
            raise ValidationError(
                "Invalid Progression source type."
            )

        if car is None:
            raise ValidationError(
                "Vehicle is required before Progression can be completed."
            )

        car = (
            Car.objects
            .select_for_update()
            .get(pk=car.pk)
        )

        if car.status not in {
            Car.Status.BOOKED,
            Car.Status.SOLD,
        }:
            raise ValidationError(
                f"Vehicle must be Booked before completion. "
                f"Current status: {car.status}."
            )

        if car.status == Car.Status.BOOKED:
            InventoryService.update_car_status(
                car=car,
                new_status=Car.Status.SOLD,
            )


        progression.status = Progression.Status.COMPLETED
        progression.current_stage = Progression.Stage.COMPLETED
        progression.completed_at = timezone.now()

    # -------------------------------------------------
    # COMPLETED
    # -------------------------------------------------

    elif current_stage == Progression.Stage.COMPLETED:
        raise ValidationError(
            "Progression is already completed."
        )

    # -------------------------------------------------
    # UNKNOWN STAGE
    # -------------------------------------------------

    else:
        raise ValidationError(
            "Invalid Progression stage."
        )

    # -------------------------------------------------
    # Persist the stage change.
    # -------------------------------------------------

    progression.save(
        update_fields=[
            "status",
            "current_stage",
            "completed_at",
            "updated_at",
        ]
    )

    return progression