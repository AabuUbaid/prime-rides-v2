from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from insurance.models import Insurance
from quotes.models import QuoteSequence

from .models import Proforma


PROFORMA_SEQUENCE_NAME = "proforma"
PROFORMA_NUMBER_PREFIX = "PRIN"


def generate_proforma_number():
    with transaction.atomic():
        sequence, _ = (
            QuoteSequence.objects
            .select_for_update()
            .get_or_create(
                name=PROFORMA_SEQUENCE_NAME,
                defaults={"current_number": 0},
            )
        )

        sequence.current_number += 1
        sequence.save(update_fields=["current_number"])

        return f"{PROFORMA_NUMBER_PREFIX}-{sequence.current_number:05d}"


@transaction.atomic
def create_proforma(
    *,
    insurance,
    user,
    proforma_date,
    vat=Decimal("0.00"),
    bank_financed_by="",
    lpo="",
):
    insurance = (
        Insurance.objects
        .select_related("quote")
        .select_for_update()
        .get(pk=insurance.pk)
    )

    if insurance.application_status != Insurance.ApplicationStatus.APPROVED:
        raise ValidationError(
            "Proforma can only be created after Insurance is approved."
        )

    if Proforma.objects.filter(
        quote=insurance.quote
    ).exists():
        raise ValidationError(
            "A Proforma already exists for this deal."
        )

    payment_method_map = {
        "Finance": Proforma.PaymentType.FINANCE,
        "Cash": Proforma.PaymentType.CASH,
    }

    payment_type = payment_method_map.get(
        insurance.payment_method
    )

    if payment_type is None:
        raise ValidationError(
            "Unsupported payment type for Proforma."
        )

    if payment_type not in {
        Proforma.PaymentType.FINANCE,
        Proforma.PaymentType.CASH,
    }:
        raise ValidationError(
            "Unsupported payment type for Proforma."
        )

    vehicle_price = (
        insurance.quote.price
        or Decimal("0.00")
    )

    if vehicle_price < Decimal("0.00"):
        raise ValidationError(
            "Vehicle price cannot be negative."
        )

    if payment_type == Proforma.PaymentType.FINANCE:
        down_payment = (
            insurance.quote.down_payment
            or Decimal("0.00")
        )

        if down_payment < Decimal("0.00"):
            raise ValidationError(
                "Down payment cannot be negative."
            )

        if down_payment > vehicle_price:
            raise ValidationError(
                "Down payment cannot exceed vehicle price."
            )

        net_finance = vehicle_price - down_payment

        if not bank_financed_by:
            bank_financed_by = (
                insurance.quote.emi_bank_name
                or ""
            )

    else:
        bank_financed_by = ""
        lpo = ""
        down_payment = Decimal("0.00")
        net_finance = None

    vat = Decimal(vat or "0.00")

    if vat < Decimal("0.00"):
        raise ValidationError(
            "VAT cannot be negative."
        )

    return Proforma.objects.create(
        quote=insurance.quote,
        insurance=insurance,
        proforma_number=generate_proforma_number(),
        proforma_date=proforma_date,
        payment_type=payment_type,
        bank_financed_by=bank_financed_by,
        lpo=lpo,
        customer_name=insurance.customer_name,
        customer_mobile=insurance.customer_mobile,
        vehicle_make=insurance.vehicle_make,
        vehicle_model=insurance.vehicle_model,
        vehicle_year=insurance.vehicle_year,
        vehicle_chassis_number=insurance.vehicle_chassis_number,
        vehicle_engine_number=insurance.vehicle_engine_number,
        vehicle_mileage=insurance.vehicle_mileage,
        vehicle_price=vehicle_price,
        down_payment=down_payment,
        net_finance=net_finance,
        vat=vat,
        created_by=user,
    )


def update_proforma(*, proforma, data):
    editable_fields = {
        "proforma_date",
        "bank_financed_by",
        "lpo",
        "customer_name",
        "customer_mobile",
        "vehicle_make",
        "vehicle_model",
        "vehicle_year",
        "vehicle_chassis_number",
        "vehicle_engine_number",
        "vehicle_mileage",
        "vehicle_price",
        "down_payment",
        "vat",
    }

    for field, value in data.items():
        if field in editable_fields:
            setattr(
                proforma,
                field,
                value,
            )

    if proforma.vehicle_price < Decimal("0.00"):
        raise ValidationError(
            "Vehicle price cannot be negative."
        )

    if proforma.down_payment < Decimal("0.00"):
        raise ValidationError(
            "Down payment cannot be negative."
        )

    if proforma.down_payment > proforma.vehicle_price:
        raise ValidationError(
            "Down payment cannot exceed vehicle price."
        )

    if proforma.vat < Decimal("0.00"):
        raise ValidationError(
            "VAT cannot be negative."
        )

    if proforma.payment_type == Proforma.PaymentType.FINANCE:
        proforma.net_finance = (
            proforma.vehicle_price
            - proforma.down_payment
        )

    else:
        proforma.bank_financed_by = ""
        proforma.lpo = ""
        proforma.down_payment = Decimal("0.00")
        proforma.net_finance = None

    proforma.save()

    return proforma