from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Max

from apps.inventory.models import Vehicle, VehicleDocument, VehicleImage

User = get_user_model()


@transaction.atomic
def upload_vehicle_image(
    *,
    vehicle: Vehicle,
    image,
    user: User | None = None,
    alt_text: str = "",
    display_order: int | None = None,
    is_primary: bool = False,
) -> VehicleImage:
    if display_order is None:
        max_order = vehicle.images.aggregate(max_order=Max("display_order"))[
            "max_order"
        ]
        display_order = (max_order or 0) + 1

    should_be_primary = is_primary or not vehicle.images.exists()

    if should_be_primary:
        vehicle.images.update(is_primary=False)

    image_record = VehicleImage(
        vehicle=vehicle,
        image=image,
        alt_text=alt_text,
        display_order=display_order,
        is_primary=should_be_primary,
    )

    if user is not None and user.is_authenticated:
        image_record.created_by = user
        image_record.updated_by = user

    image_record.full_clean()
    image_record.save()

    return image_record


@transaction.atomic
def set_primary_vehicle_image(
    *,
    image_record: VehicleImage,
    user: User | None = None,
) -> VehicleImage:
    VehicleImage.objects.filter(vehicle=image_record.vehicle).update(
        is_primary=False
    )

    image_record.is_primary = True
    if user is not None and user.is_authenticated:
        image_record.updated_by = user
        image_record.save(update_fields=["is_primary", "updated_by", "updated_at"])
    else:
        image_record.save(update_fields=["is_primary", "updated_at"])

    return image_record


@transaction.atomic
def delete_vehicle_image(
    *,
    image_record: VehicleImage,
    user: User | None = None,
) -> VehicleImage:
    was_primary = image_record.is_primary
    vehicle = image_record.vehicle

    image_record.is_active = False
    image_record.is_primary = False
    if user is not None and user.is_authenticated:
        image_record.updated_by = user
        image_record.save(
            update_fields=["is_active", "is_primary", "updated_by", "updated_at"]
        )
    else:
        image_record.save(update_fields=["is_active", "is_primary", "updated_at"])

    if was_primary:
        replacement = vehicle.images.order_by("display_order", "created_at").first()
        if replacement is not None:
            set_primary_vehicle_image(image_record=replacement, user=user)

    return image_record


@transaction.atomic
def upload_vehicle_document(
    *,
    vehicle: Vehicle,
    document,
    user: User | None = None,
    **data: Any,
) -> VehicleDocument:
    document_record = VehicleDocument(
        vehicle=vehicle,
        document=document,
        **data,
    )

    if user is not None and user.is_authenticated:
        document_record.created_by = user
        document_record.updated_by = user

    document_record.full_clean()
    document_record.save()

    return document_record


@transaction.atomic
def delete_vehicle_document(
    *,
    document_record: VehicleDocument,
    user: User | None = None,
) -> VehicleDocument:
    document_record.is_active = False
    if user is not None and user.is_authenticated:
        document_record.updated_by = user
        document_record.save(update_fields=["is_active", "updated_by", "updated_at"])
    else:
        document_record.save(update_fields=["is_active", "updated_at"])

    return document_record
