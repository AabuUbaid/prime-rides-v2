from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.inventory.models import Vehicle, VehicleStatus
from apps.inventory.validators import (
    validate_model_year,
    validate_pricing,
    validate_vehicle_hierarchy,
    validate_vin,
)

User = get_user_model()


@transaction.atomic
def create_vehicle(*, user: User | None = None, **data: Any) -> Vehicle:
    validate_vehicle_hierarchy(
        data["vehicle_model"],
        data["generation"],
        data["variant"],
    )

    data["vin"] = validate_vin(data["vin"])

    validate_model_year(
        data["manufacturing_year"],
        data["model_year"],
    )

    validate_pricing(
        data["purchase_price"],
        data["selling_price"],
        data["minimum_selling_price"],
    )

    if user is not None and user.is_authenticated:
        data["created_by"] = user
        data["updated_by"] = user

    vehicle = Vehicle(**data)
    vehicle.full_clean(exclude=["stock_number", "slug"])
    vehicle.save()

    return vehicle


@transaction.atomic
def update_vehicle(
    *,
    vehicle: Vehicle,
    user: User | None = None,
    **data: Any,
) -> Vehicle:
    vehicle_model = data.get("vehicle_model", vehicle.vehicle_model)
    generation = data.get("generation", vehicle.generation)
    variant = data.get("variant", vehicle.variant)

    validate_vehicle_hierarchy(
        vehicle_model,
        generation,
        variant,
    )

    validate_model_year(
        data.get("manufacturing_year", vehicle.manufacturing_year),
        data.get("model_year", vehicle.model_year),
    )

    validate_pricing(
        data.get("purchase_price", vehicle.purchase_price),
        data.get("selling_price", vehicle.selling_price),
        data.get("minimum_selling_price", vehicle.minimum_selling_price),
    )

    if "vin" in data:
        data["vin"] = validate_vin(data["vin"])

    if user is not None and user.is_authenticated:
        data["updated_by"] = user

    for field, value in data.items():
        setattr(vehicle, field, value)

    vehicle.full_clean()
    vehicle.save()

    return vehicle


@transaction.atomic
def publish_vehicle(vehicle: Vehicle, *, user: User | None = None) -> Vehicle:
    if vehicle.published:
        return vehicle

    vehicle.published = True
    if user is not None and user.is_authenticated:
        vehicle.updated_by = user
        vehicle.save(update_fields=["published", "updated_by", "updated_at"])
    else:
        vehicle.save(update_fields=["published", "updated_at"])

    return vehicle


@transaction.atomic
def unpublish_vehicle(vehicle: Vehicle, *, user: User | None = None) -> Vehicle:
    if not vehicle.published:
        return vehicle

    vehicle.published = False
    if user is not None and user.is_authenticated:
        vehicle.updated_by = user
        vehicle.save(update_fields=["published", "updated_by", "updated_at"])
    else:
        vehicle.save(update_fields=["published", "updated_at"])

    return vehicle


@transaction.atomic
def feature_vehicle(vehicle: Vehicle, *, user: User | None = None) -> Vehicle:
    if vehicle.featured:
        return vehicle

    vehicle.featured = True
    if user is not None and user.is_authenticated:
        vehicle.updated_by = user
        vehicle.save(update_fields=["featured", "updated_by", "updated_at"])
    else:
        vehicle.save(update_fields=["featured", "updated_at"])

    return vehicle


@transaction.atomic
def unfeature_vehicle(vehicle: Vehicle, *, user: User | None = None) -> Vehicle:
    if not vehicle.featured:
        return vehicle

    vehicle.featured = False
    if user is not None and user.is_authenticated:
        vehicle.updated_by = user
        vehicle.save(update_fields=["featured", "updated_by", "updated_at"])
    else:
        vehicle.save(update_fields=["featured", "updated_at"])

    return vehicle


@transaction.atomic
def change_status(
    vehicle: Vehicle,
    status: VehicleStatus,
    *,
    user: User | None = None,
) -> Vehicle:
    vehicle.status = status
    if user is not None and user.is_authenticated:
        vehicle.updated_by = user
        vehicle.save(update_fields=["status", "updated_by", "updated_at"])
    else:
        vehicle.save(update_fields=["status", "updated_at"])

    return vehicle


@transaction.atomic
def delete_vehicle(vehicle: Vehicle, *, user: User | None = None) -> Vehicle:
    vehicle.is_active = False
    if user is not None and user.is_authenticated:
        vehicle.updated_by = user
        vehicle.save(update_fields=["is_active", "updated_by", "updated_at"])
    else:
        vehicle.save(update_fields=["is_active", "updated_at"])

    return vehicle
