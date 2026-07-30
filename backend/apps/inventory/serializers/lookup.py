from rest_framework import serializers

from apps.inventory.models import (
    Manufacturer,
    VehicleModel,
    Generation,
    Variant,
    FuelType,
    Transmission,
    DriveType,
    BodyType,
    Color,
    InteriorColor,
    EngineType,
    VehicleStatus,
)

from .base import BaseModelSerializer


# ============================================================
# Generic Lookup Serializer
# ============================================================

class LookupSerializer(BaseModelSerializer):
    class Meta:
        fields = (
            "id",
            "code",
            "name",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        )


# ============================================================
# Manufacturer
# ============================================================

class ManufacturerSerializer(BaseModelSerializer):
    class Meta:
        model = Manufacturer
        fields = (
            "id",
            "code",
            "name",
            "is_active",
            "created_at",
            "updated_at",
        )


# ============================================================
# Vehicle Model
# ============================================================

class VehicleModelSerializer(BaseModelSerializer):

    manufacturer = ManufacturerSerializer(read_only=True)

    class Meta:
        model = VehicleModel
        fields = (
            "id",
            "manufacturer",
            "code",
            "name",
            "is_active",
            "created_at",
            "updated_at",
        )


# ============================================================
# Generation
# ============================================================

class GenerationSerializer(BaseModelSerializer):

    vehicle_model = VehicleModelSerializer(read_only=True)

    class Meta:
        model = Generation
        fields = (
            "id",
            "vehicle_model",
            "code",
            "name",
            "production_start_year",
            "production_end_year",
            "is_active",
            "created_at",
            "updated_at",
        )


# ============================================================
# Variant
# ============================================================

class VariantSerializer(BaseModelSerializer):

    generation = GenerationSerializer(read_only=True)

    class Meta:
        model = Variant
        fields = (
            "id",
            "generation",
            "code",
            "name",
            "is_active",
            "created_at",
            "updated_at",
        )


# ============================================================
# Lookup Models
# ============================================================

class FuelTypeSerializer(LookupSerializer):
    class Meta(LookupSerializer.Meta):
        model = FuelType


class TransmissionSerializer(LookupSerializer):
    class Meta(LookupSerializer.Meta):
        model = Transmission


class DriveTypeSerializer(LookupSerializer):
    class Meta(LookupSerializer.Meta):
        model = DriveType


class BodyTypeSerializer(LookupSerializer):
    class Meta(LookupSerializer.Meta):
        model = BodyType


class ColorSerializer(LookupSerializer):
    class Meta(LookupSerializer.Meta):
        model = Color


class InteriorColorSerializer(LookupSerializer):
    class Meta(LookupSerializer.Meta):
        model = InteriorColor


class EngineTypeSerializer(LookupSerializer):
    class Meta(LookupSerializer.Meta):
        model = EngineType


class VehicleStatusSerializer(LookupSerializer):
    class Meta(LookupSerializer.Meta):
        model = VehicleStatus
