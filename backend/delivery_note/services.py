from django.core.exceptions import ValidationError
from django.db import transaction

from insurance.models import Insurance
from quotes.models import QuoteSequence

from .models import DeliveryNote


DELIVERY_NOTE_SEQUENCE_NAME = "delivery_note"
DELIVERY_NOTE_NUMBER_PREFIX = "DN"


def generate_delivery_note_number():
    with transaction.atomic():
        sequence, _ = (
            QuoteSequence.objects
            .select_for_update()
            .get_or_create(
                name=DELIVERY_NOTE_SEQUENCE_NAME,
                defaults={"current_number": 0},
            )
        )

        sequence.current_number += 1
        sequence.save(
            update_fields=["current_number"],
        )

        return (
            f"{DELIVERY_NOTE_NUMBER_PREFIX}-"
            f"{sequence.current_number:06d}"
        )


@transaction.atomic
def create_delivery_note(
    *,
    insurance,
    user,
    delivery_date,
    buyer_name="",
    buyer_signature="",
    buyer_signature_date=None,
):
    insurance = (
        Insurance.objects
        .select_related("quote")
        .select_for_update()
        .get(pk=insurance.pk)
    )

    if insurance.application_status != (
        Insurance.ApplicationStatus.APPROVED
    ):
        raise ValidationError(
            "Delivery Note can only be created after Insurance is approved."
        )

    if DeliveryNote.objects.filter(
        quote=insurance.quote
    ).exists():
        raise ValidationError(
            "A Delivery Note already exists for this deal."
        )

    return DeliveryNote.objects.create(
        quote=insurance.quote,
        insurance=insurance,
        delivery_note_number=generate_delivery_note_number(),
        delivery_date=delivery_date,
        customer_name=insurance.customer_name,
        vehicle_make=insurance.vehicle_make,
        vehicle_model=insurance.vehicle_model,
        vehicle_year=insurance.vehicle_year,
        vehicle_colour=insurance.vehicle_colour,
        vehicle_chassis_number=insurance.vehicle_chassis_number,
        vehicle_engine_number=insurance.vehicle_engine_number,
        vehicle_mileage=insurance.vehicle_mileage,
        quantity=1,
        unit="Car",
        buyer_name=buyer_name,
        buyer_signature=buyer_signature,
        buyer_signature_date=buyer_signature_date,
        created_by=user,
    )


def update_delivery_note(
    *,
    delivery_note,
    data,
):
    allowed_fields = {
        "delivery_date",
        "customer_name",
        "vehicle_make",
        "vehicle_model",
        "vehicle_year",
        "vehicle_colour",
        "vehicle_chassis_number",
        "vehicle_engine_number",
        "vehicle_mileage",
        "buyer_name",
        "buyer_signature",
        "buyer_signature_date",
    }

    for field, value in data.items():
        if field in allowed_fields:
            setattr(
                delivery_note,
                field,
                value,
            )

    delivery_note.quantity = 1
    delivery_note.unit = "Car"

    delivery_note.save()

    return delivery_note