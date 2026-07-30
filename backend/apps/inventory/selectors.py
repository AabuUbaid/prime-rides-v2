from __future__ import annotations

from django.db.models import Prefetch, Q
from django.shortcuts import get_object_or_404

from apps.inventory.models import (
    BodyType,
    Color,
    DriveType,
    EngineType,
    FuelType,
    Generation,
    InteriorColor,
    Manufacturer,
    Transmission,
    Variant,
    Vehicle,
    VehicleDocument,
    VehicleImage,
    VehicleModel,
    VehicleStatus,
)


def vehicle_queryset():
    return (
        Vehicle.objects.select_related(
            "vehicle_model",
            "vehicle_model__manufacturer",
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
            "created_by",
            "updated_by",
        )
        .prefetch_related(
            Prefetch("images", queryset=VehicleImage.objects.order_by("display_order")),
            Prefetch("documents", queryset=VehicleDocument.objects.order_by("title")),
        )
    )


def get_vehicle(vehicle_id):
    return get_object_or_404(
        vehicle_queryset(),
        pk=vehicle_id,
    )


def get_vehicle_by_stock_number(stock_number):
    return get_object_or_404(
        vehicle_queryset(),
        stock_number=stock_number,
    )


def get_vehicle_by_slug(slug):
    return get_object_or_404(
        vehicle_queryset(),
        slug=slug,
        published=True,
    )


def get_vehicle_image(image_id):
    return get_object_or_404(
        VehicleImage.objects.select_related("vehicle"),
        pk=image_id,
    )


def get_vehicle_document(document_id):
    return get_object_or_404(
        VehicleDocument.objects.select_related("vehicle"),
        pk=document_id,
    )


def list_vehicle_images(vehicle):
    return VehicleImage.objects.filter(vehicle=vehicle).order_by(
        "display_order",
        "created_at",
    )


def list_vehicle_documents(vehicle):
    return VehicleDocument.objects.filter(vehicle=vehicle).order_by(
        "document_type",
        "title",
    )


def list_inventory():
    return vehicle_queryset()


def list_available():
    return vehicle_queryset().available()


def list_reserved():
    return vehicle_queryset().reserved()


def list_sold():
    return vehicle_queryset().sold()


def list_featured():
    return vehicle_queryset().featured()


def list_published():
    return vehicle_queryset().published()


def by_manufacturer(manufacturer_id):
    return vehicle_queryset().filter(
        vehicle_model__manufacturer_id=manufacturer_id
    )


def by_vehicle_model(vehicle_model_id):
    return vehicle_queryset().filter(vehicle_model_id=vehicle_model_id)


def by_generation(generation_id):
    return vehicle_queryset().filter(generation_id=generation_id)


def by_variant(variant_id):
    return vehicle_queryset().filter(variant_id=variant_id)


def by_status(status_code):
    return vehicle_queryset().filter(status__code=status_code)


def search_inventory(query):
    if not query:
        return vehicle_queryset()

    return (
        vehicle_queryset()
        .filter(
            Q(stock_number__icontains=query)
            | Q(vin__icontains=query)
            | Q(engine_number__icontains=query)
            | Q(registration_number__icontains=query)
            | Q(vehicle_model__name__icontains=query)
            | Q(vehicle_model__manufacturer__name__icontains=query)
            | Q(generation__code__icontains=query)
            | Q(variant__name__icontains=query)
        )
        .distinct()
    )


def list_manufacturers():
    return Manufacturer.objects.active().order_by("display_order", "name")


def list_vehicle_models():
    return VehicleModel.objects.active().select_related("manufacturer")


def list_generations():
    return Generation.objects.active().select_related(
        "vehicle_model",
        "vehicle_model__manufacturer",
    )


def list_variants():
    return Variant.objects.active().select_related(
        "generation",
        "generation__vehicle_model",
        "generation__vehicle_model__manufacturer",
    )


def list_fuel_types():
    return FuelType.objects.active().order_by("display_order", "name")


def list_transmissions():
    return Transmission.objects.active().order_by("display_order", "name")


def list_drive_types():
    return DriveType.objects.active().order_by("display_order", "name")


def list_body_types():
    return BodyType.objects.active().order_by("display_order", "name")


def list_engine_types():
    return EngineType.objects.active().order_by("display_order", "name")


def list_colors():
    return Color.objects.active().order_by("display_order", "name")


def list_interior_colors():
    return InteriorColor.objects.active().order_by("display_order", "name")


def list_vehicle_statuses():
    return VehicleStatus.objects.active().order_by("display_order", "name")
