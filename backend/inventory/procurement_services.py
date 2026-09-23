from django.db import transaction

from .models import ProcurementCheck


def _get_body_type(vehicle_type):
    if not vehicle_type:
        return ""

    value = str(vehicle_type).strip().lower()

    body_type_mapping = {
        "sedan": ProcurementCheck.BodyType.SEDAN,
        "suv": ProcurementCheck.BodyType.SUV,
        "coupe": ProcurementCheck.BodyType.COUPE,
        "hatchback": ProcurementCheck.BodyType.HATCHBACK,
        "pickup": ProcurementCheck.BodyType.PICKUP,
        "van": ProcurementCheck.BodyType.VAN,
    }

    return body_type_mapping.get(
        value,
        ProcurementCheck.BodyType.OTHER,
    )


@transaction.atomic
def create_procurement_check(*, validated_data, checked_by):
    car = validated_data.get("car")

    if car:
        validated_data.update({
            "chassis_number": car.chassis_number or "",
            "make": car.make or "",
            "model": car.model or "",
            "range_trim_code": car.variant or "",
            "model_year": car.year,
            "engine": car.engine_number or "",
            "body_type": _get_body_type(car.vehicle_type),
            "mileage": car.mileage,
            "colour": car.colour or "",
        })

    procurement_check = ProcurementCheck.objects.create(
        checked_by=checked_by,
        **validated_data,
    )

    return procurement_check


@transaction.atomic
def update_procurement_check(
    *,
    procurement_check,
    validated_data,
):
    car = validated_data.get(
        "car",
        procurement_check.car,
    )

    if car:
        validated_data.update({
            "chassis_number": car.chassis_number or "",
            "make": car.make or "",
            "model": car.model or "",
            "range_trim_code": car.variant or "",
            "model_year": car.year,
            "engine": car.engine_number or "",
            "body_type": _get_body_type(car.vehicle_type),
            "mileage": car.mileage,
            "colour": car.colour or "",
        })

    for field, value in validated_data.items():
        setattr(procurement_check, field, value)

    procurement_check.save()

    return procurement_check