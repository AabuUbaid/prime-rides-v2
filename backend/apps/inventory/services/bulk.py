from __future__ import annotations

import csv
from datetime import date
from decimal import Decimal
from io import TextIOWrapper
from typing import Any

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import UploadedFile
from django.db import transaction

from apps.inventory.models import (
    BodyType,
    Color,
    DriveType,
    EngineType,
    FuelType,
    Generation,
    InteriorColor,
    Transmission,
    Variant,
    Vehicle,
    VehicleModel,
    VehicleStatus,
)
from apps.inventory.services.vehicle import create_vehicle

User = get_user_model()

FOREIGN_KEY_FIELDS = {
    "vehicle_model": VehicleModel,
    "generation": Generation,
    "variant": Variant,
    "fuel_type": FuelType,
    "transmission": Transmission,
    "drive_type": DriveType,
    "body_type": BodyType,
    "engine_type": EngineType,
    "exterior_color": Color,
    "interior_color": InteriorColor,
    "status": VehicleStatus,
}

INTEGER_FIELDS = {
    "manufacturing_year",
    "model_year",
    "engine_capacity_cc",
    "horsepower",
    "torque_nm",
    "doors",
    "seats",
    "mileage",
    "owner_count",
}

DECIMAL_FIELDS = {
    "purchase_price",
    "selling_price",
    "minimum_selling_price",
}

BOOLEAN_FIELDS = {
    "service_history",
    "accident_history",
    "warranty_available",
    "imported",
    "featured",
    "published",
}

EXPORT_FIELDS = (
    "id",
    "stock_number",
    "vin",
    "engine_number",
    "registration_number",
    "manufacturer",
    "vehicle_model",
    "generation",
    "variant",
    "fuel_type",
    "transmission",
    "drive_type",
    "body_type",
    "engine_type",
    "exterior_color",
    "interior_color",
    "status",
    "manufacturing_year",
    "model_year",
    "engine_capacity_cc",
    "horsepower",
    "torque_nm",
    "doors",
    "seats",
    "mileage",
    "owner_count",
    "service_history",
    "accident_history",
    "warranty_available",
    "imported",
    "purchase_price",
    "selling_price",
    "minimum_selling_price",
    "purchase_date",
    "featured",
    "published",
    "description",
)


def import_vehicles_from_csv(
    *,
    file: UploadedFile,
    user: User | None = None,
) -> dict[str, Any]:
    decoded_file = TextIOWrapper(file.file, encoding="utf-8-sig")
    reader = csv.DictReader(decoded_file)

    created = 0
    errors: list[dict[str, Any]] = []

    for row_number, row in enumerate(reader, start=2):
        try:
            data = _normalize_row(row)
            with transaction.atomic():
                create_vehicle(user=user, **data)
            created += 1
        except Exception as exc:  # noqa: BLE001
            errors.append(
                {
                    "row": row_number,
                    "errors": _format_exception(exc),
                }
            )

    return {
        "created_count": created,
        "failed_count": len(errors),
        "errors": errors,
    }


def export_vehicles(vehicles) -> list[dict[str, Any]]:
    return [_vehicle_to_row(vehicle) for vehicle in vehicles]


def _normalize_row(row: dict[str, str]) -> dict[str, Any]:
    normalized: dict[str, Any] = {}

    for key, value in row.items():
        if key is None:
            continue

        clean_key = key.strip()
        clean_value = value.strip() if isinstance(value, str) else value

        if clean_value in ("", None):
            continue

        if clean_key in FOREIGN_KEY_FIELDS:
            normalized[clean_key] = FOREIGN_KEY_FIELDS[clean_key].objects.get(
                pk=clean_value
            )
        elif clean_key in INTEGER_FIELDS:
            normalized[clean_key] = int(clean_value)
        elif clean_key in DECIMAL_FIELDS:
            normalized[clean_key] = Decimal(clean_value)
        elif clean_key in BOOLEAN_FIELDS:
            normalized[clean_key] = _parse_bool(clean_value)
        elif clean_key == "purchase_date":
            normalized[clean_key] = date.fromisoformat(clean_value)
        else:
            normalized[clean_key] = clean_value

    return normalized


def _parse_bool(value: str) -> bool:
    return value.lower() in {"1", "true", "yes", "y"}


def _vehicle_to_row(vehicle: Vehicle) -> dict[str, Any]:
    return {
        "id": str(vehicle.id),
        "stock_number": vehicle.stock_number,
        "vin": vehicle.vin,
        "engine_number": vehicle.engine_number,
        "registration_number": vehicle.registration_number,
        "manufacturer": vehicle.vehicle_model.manufacturer.name,
        "vehicle_model": vehicle.vehicle_model.name,
        "generation": vehicle.generation.code,
        "variant": vehicle.variant.name,
        "fuel_type": vehicle.fuel_type.name,
        "transmission": vehicle.transmission.name,
        "drive_type": vehicle.drive_type.name,
        "body_type": vehicle.body_type.name,
        "engine_type": vehicle.engine_type.name,
        "exterior_color": vehicle.exterior_color.name,
        "interior_color": vehicle.interior_color.name,
        "status": vehicle.status.name,
        "manufacturing_year": vehicle.manufacturing_year,
        "model_year": vehicle.model_year,
        "engine_capacity_cc": vehicle.engine_capacity_cc,
        "horsepower": vehicle.horsepower,
        "torque_nm": vehicle.torque_nm,
        "doors": vehicle.doors,
        "seats": vehicle.seats,
        "mileage": vehicle.mileage,
        "owner_count": vehicle.owner_count,
        "service_history": vehicle.service_history,
        "accident_history": vehicle.accident_history,
        "warranty_available": vehicle.warranty_available,
        "imported": vehicle.imported,
        "purchase_price": str(vehicle.purchase_price),
        "selling_price": str(vehicle.selling_price),
        "minimum_selling_price": str(vehicle.minimum_selling_price),
        "purchase_date": vehicle.purchase_date.isoformat(),
        "featured": vehicle.featured,
        "published": vehicle.published,
        "description": vehicle.description,
    }


def _format_exception(exc: Exception) -> Any:
    if hasattr(exc, "message_dict"):
        return exc.message_dict
    if hasattr(exc, "messages"):
        return exc.messages
    return str(exc)
