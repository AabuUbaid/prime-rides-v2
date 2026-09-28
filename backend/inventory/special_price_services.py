from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Car, CarExpense, SpecialPriceRequest


class SpecialPriceService:
    REQUESTER_ROLES = {
        "ADMIN",
        "SALES_STAFF",
    }

    MASTER_ROLE = "MASTER"

    @staticmethod
    def _get_vehicle_expenses(car):
        total = (
            CarExpense.objects
            .filter(car=car)
            .aggregate(total=Sum("amount"))
            .get("total")
        )

        return total or Decimal("0.00")

    @staticmethod
    @transaction.atomic
    def create_request(
        *,
        car_id,
        requested_price,
        requested_by,
    ):
        if getattr(requested_by, "role", None) not in (
            SpecialPriceService.REQUESTER_ROLES
        ):
            raise ValidationError(
                "Only Admin or Sales Staff can request a Special Price."
            )

        car = (
            Car.objects
            .select_for_update()
            .get(pk=car_id)
        )

        if car.least_selling_price is None:
            raise ValidationError(
                "Vehicle does not have a Least Selling Price."
            )

        requested_price = Decimal(requested_price)

        if requested_price < 0:
            raise ValidationError(
                {
                    "requested_price": (
                        "Requested price cannot be negative."
                    )
                }
            )

        if requested_price >= car.least_selling_price:
            raise ValidationError(
                {
                    "requested_price": (
                        "Special Price enquiry is only required "
                        "below the current Least Selling Price."
                    )
                }
            )

        pending_exists = (
            SpecialPriceRequest.objects
            .filter(
                car=car,
                status=SpecialPriceRequest.Status.PENDING,
            )
            .exists()
        )

        if pending_exists:
            raise ValidationError(
                "A pending Special Price request already exists "
                "for this vehicle."
            )

        vehicle_expenses = (
            SpecialPriceService._get_vehicle_expenses(car)
        )

        return SpecialPriceRequest.objects.create(
            car=car,
            requested_price=requested_price,
            requested_by=requested_by,
            inventory_asked_price=car.asking_price,
            inventory_vehicle_expenses=vehicle_expenses,
            least_selling_price_at_request=(
                car.least_selling_price
            ),
            status=SpecialPriceRequest.Status.PENDING,
        )

    @staticmethod
    @transaction.atomic
    def approve(
        *,
        request_id,
        approved_by,
        approved_price=None,
        expires_at=None,
        decision_note="",
    ):
        if getattr(approved_by, "role", None) != (
            SpecialPriceService.MASTER_ROLE
        ):
            raise ValidationError(
                "Only Master users can approve a Special Price request."
            )

        special_request = (
            SpecialPriceRequest.objects
            .select_for_update()
            .get(pk=request_id)
        )

        if special_request.status != (
            SpecialPriceRequest.Status.PENDING
        ):
            raise ValidationError(
                "Only pending Special Price requests can be approved."
            )

        if expires_at is None:
            raise ValidationError(
                {
                    "expires_at": (
                        "Master must provide an approval expiry."
                    )
                }
            )

        if expires_at <= timezone.now():
            raise ValidationError(
                {
                    "expires_at": (
                        "Approval expiry must be in the future."
                    )
                }
            )

        car = (
            Car.objects
            .select_for_update()
            .get(pk=special_request.car_id)
        )

        if car.least_selling_price is None:
            raise ValidationError(
                "Vehicle does not have a Least Selling Price."
            )

        if approved_price is None:
            approved_price = special_request.requested_price

        approved_price = Decimal(approved_price)

        if approved_price < 0:
            raise ValidationError(
                {
                    "approved_price": (
                        "Approved price cannot be negative."
                    )
                }
            )

        # Approval must remain a below-Least-Selling transaction.
        if approved_price >= car.least_selling_price:
            raise ValidationError(
                {
                    "approved_price": (
                        "Approved Special Price must be below "
                        "the current Least Selling Price."
                    )
                }
            )

        special_request.status = (
            SpecialPriceRequest.Status.APPROVED
        )
        special_request.approved_price = approved_price
        special_request.approved_by = approved_by
        special_request.approved_at = timezone.now()
        special_request.expires_at = expires_at
        special_request.decision_note = (
            decision_note or ""
        ).strip()

        special_request.save(
            update_fields=[
                "status",
                "approved_price",
                "approved_by",
                "approved_at",
                "expires_at",
                "decision_note",
                "updated_at",
            ]
        )

        # IMPORTANT:
        # Do NOT modify:
        #
        # car.least_selling_price
        # car.asking_price
        #
        # Special Price approval is transaction-specific.

        return special_request

    @staticmethod
    @transaction.atomic
    def decline(
        *,
        request_id,
        declined_by,
        decision_note="",
    ):
        if getattr(declined_by, "role", None) != (
            SpecialPriceService.MASTER_ROLE
        ):
            raise ValidationError(
                "Only Master users can decline a Special Price request."
            )

        special_request = (
            SpecialPriceRequest.objects
            .select_for_update()
            .get(pk=request_id)
        )

        if special_request.status != (
            SpecialPriceRequest.Status.PENDING
        ):
            raise ValidationError(
                "Only pending Special Price requests can be declined."
            )

        special_request.status = (
            SpecialPriceRequest.Status.DECLINED
        )
        special_request.approved_by = declined_by
        special_request.declined_at = timezone.now()
        special_request.decision_note = (
            decision_note or ""
        ).strip()

        special_request.save(
            update_fields=[
                "status",
                "approved_by",
                "declined_at",
                "decision_note",
                "updated_at",
            ]
        )

        return special_request

    @staticmethod
    @transaction.atomic
    def expire_if_required(
        special_request,
    ):
        if (
            special_request.status
            != SpecialPriceRequest.Status.APPROVED
        ):
            return special_request

        if not special_request.expires_at:
            return special_request

        if special_request.expires_at > timezone.now():
            return special_request

        special_request.status = (
            SpecialPriceRequest.Status.EXPIRED
        )

        special_request.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        return special_request

    @staticmethod
    @transaction.atomic
    def expire_queryset(queryset, *, at=None):
        expired_at = at or timezone.now()

        return queryset.filter(
            status=SpecialPriceRequest.Status.APPROVED,
            expires_at__lte=expired_at,
        ).update(
            status=SpecialPriceRequest.Status.EXPIRED,
            updated_at=expired_at,
        )

    @staticmethod
    @transaction.atomic
    def mark_used(
        *,
        request_id,
        used_by,
    ):
        special_request = (
            SpecialPriceRequest.objects
            .select_for_update()
            .get(pk=request_id)
        )

        if special_request.status == (
            SpecialPriceRequest.Status.APPROVED
        ):
            if (
                special_request.expires_at
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

                raise ValidationError(
                    "The Special Price approval has expired."
                )

        if special_request.status != (
            SpecialPriceRequest.Status.APPROVED
        ):
            raise ValidationError(
                "Only an active approved Special Price can be used."
            )

        special_request.status = (
            SpecialPriceRequest.Status.USED
        )
        special_request.used_at = timezone.now()
        special_request.used_by = used_by

        special_request.save(
            update_fields=[
                "status",
                "used_at",
                "used_by",
                "updated_at",
            ]
        )

        return special_request
    
    @staticmethod
    @transaction.atomic
    def validate_transaction_price(
        *,
        special_price_request_id=None,
        car=None,
        transaction_price,
        actor=None,
        transaction_type,
        emi_sheet=None,
    ):
        """
        Validate a transaction price against the vehicle's
        Least Selling Price and, where required, an approved
        Special Price request.

        transaction_type:
            "emi"
            "quote"
        """

        if car is None:
            if special_price_request_id is not None:
                raise ValidationError(
                    "Special Price approval requires an inventory vehicle."
                )

            return None

        is_master = (
            getattr(actor, "role", None)
            == SpecialPriceService.MASTER_ROLE
        )

        transaction_price = Decimal(transaction_price)

        least_selling_price = car.least_selling_price

        if least_selling_price is None:
            return None

        # Master is not restricted by Least Selling Price.
        if is_master:
            if special_price_request_id is None:
                return None

        # Normal price: no Special Price approval required.
        if transaction_price >= least_selling_price:
            if special_price_request_id is not None:
                raise ValidationError(
                    "A Special Price approval is only used "
                    "for a price below the vehicle's Least Selling Price."
                )

            return None

        # Non-Master below Least Selling Price requires approval.
        if special_price_request_id is None:
            raise ValidationError(
                {
                    "price": (
                        "Selling price is below the Least Selling Price. "
                        "A valid Master-approved Special Price is required."
                    )
                }
            )

        special_request = (
            SpecialPriceRequest.objects
            .select_for_update()
            .get(pk=special_price_request_id)
        )

        if special_request.car_id != car.id:
            raise ValidationError(
                "The Special Price approval belongs to another vehicle."
            )

        # -----------------------------------------------------
        # Approval expiry
        # -----------------------------------------------------

        if special_request.status == (
            SpecialPriceRequest.Status.APPROVED
        ):
            if (
                special_request.expires_at
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

                raise ValidationError(
                    "The Special Price approval has expired."
                )

        # -----------------------------------------------------
        # EMI -> Quote reuse
        # -----------------------------------------------------

        if transaction_type == "quote":
            allowed_quote_context = (
                special_request.status
                == SpecialPriceRequest.Status.APPROVED
            )

            same_emi_context = (
                emi_sheet is not None
                and special_request.emi_sheet_id
                == emi_sheet.id
                and special_request.status
                == SpecialPriceRequest.Status.USED
            )

            if not allowed_quote_context and not same_emi_context:
                raise ValidationError(
                    "The Special Price approval is not active "
                    "for this Quote transaction."
                )

        elif transaction_type == "emi":
            if special_request.status != (
                SpecialPriceRequest.Status.APPROVED
            ):
                raise ValidationError(
                    "Only an approved Special Price can be used for EMI."
                )

            if special_request.emi_sheet_id is not None:
                raise ValidationError(
                    "This Special Price approval has already been "
                    "used for another EMI transaction."
                )

        else:
            raise ValidationError(
                "Invalid Special Price transaction type."
            )

        # -----------------------------------------------------
        # Approved amount must exactly match transaction price.
        # -----------------------------------------------------

        if special_request.approved_price is None:
            raise ValidationError(
                "Special Price approval does not contain an approved price."
            )

        if transaction_price != special_request.approved_price:
            raise ValidationError(
                {
                    "price": (
                        "Transaction price must exactly match "
                        "the Master-approved Special Price."
                    )
                }
            )

        # -----------------------------------------------------
        # Do not allow approval above current Least Selling Price.
        # -----------------------------------------------------

        if special_request.approved_price >= least_selling_price:
            raise ValidationError(
                "The approved Special Price is no longer below "
                "the vehicle's current Least Selling Price."
            )

        return special_request
    
    @staticmethod
    @transaction.atomic
    def bind_to_transaction(
        *,
        special_request,
        transaction_type,
        transaction,
        actor,
    ):
        """
        Bind an already validated Special Price approval to
        the actual EMI or Quote transaction.
        """

        if transaction_type == "emi":
            special_request.emi_sheet = transaction

            special_request.status = (
                SpecialPriceRequest.Status.USED
            )
            special_request.used_at = timezone.now()
            special_request.used_by = actor

            special_request.save(
                update_fields=[
                    "emi_sheet",
                    "status",
                    "used_at",
                    "used_by",
                    "updated_at",
                ]
            )

            return special_request

        if transaction_type == "quote":
            special_request.quote = transaction

            # If this Quote comes from an EMI that already consumed
            # the approval, keep the USED state and preserve history.
            if special_request.status == (
                SpecialPriceRequest.Status.APPROVED
            ):
                special_request.status = (
                    SpecialPriceRequest.Status.USED
                )
                special_request.used_at = timezone.now()
                special_request.used_by = actor

                special_request.save(
                    update_fields=[
                        "quote",
                        "status",
                        "used_at",
                        "used_by",
                        "updated_at",
                    ]
                )
            else:
                special_request.save(
                    update_fields=[
                        "quote",
                        "updated_at",
                    ]
                )

            return special_request

        raise ValidationError(
            "Invalid Special Price transaction type."
        )