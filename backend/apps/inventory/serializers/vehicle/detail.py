from rest_framework import serializers

from apps.inventory.models import Vehicle

from ..base import BaseModelSerializer
from ..lookup import (
    ManufacturerSerializer,
    VehicleModelSerializer,
    GenerationSerializer,
    VariantSerializer,
    FuelTypeSerializer,
    TransmissionSerializer,
    DriveTypeSerializer,
    BodyTypeSerializer,
    ColorSerializer,
    InteriorColorSerializer,
    EngineTypeSerializer,
    VehicleStatusSerializer,
)
from ..media import VehicleDocumentSerializer, VehicleImageSerializer


class VehicleDetailSerializer(BaseModelSerializer):
    """
    Detailed serializer for a single vehicle.
    Used by GET /vehicles/<uuid:id>/
    """

    manufacturer = ManufacturerSerializer(
        source="vehicle_model.manufacturer",
        read_only=True,
    )

    vehicle_model = VehicleModelSerializer(read_only=True)

    generation = GenerationSerializer(read_only=True)

    variant = VariantSerializer(read_only=True)

    fuel_type = FuelTypeSerializer(read_only=True)

    transmission = TransmissionSerializer(read_only=True)

    drive_type = DriveTypeSerializer(read_only=True)

    body_type = BodyTypeSerializer(read_only=True)

    engine_type = EngineTypeSerializer(read_only=True)

    exterior_color = ColorSerializer(read_only=True)

    interior_color = InteriorColorSerializer(read_only=True)

    status = VehicleStatusSerializer(read_only=True)
    images = VehicleImageSerializer(many=True, read_only=True)
    documents = VehicleDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Vehicle

        fields = (
            # Base
            "id",

            # Identity
            "stock_number",
            "vin",
            "engine_number",
            "registration_number",
            "slug",

            # Classification
            "manufacturer",
            "vehicle_model",
            "generation",
            "variant",

            # Lookup Tables
            "fuel_type",
            "transmission",
            "drive_type",
            "body_type",
            "engine_type",
            "exterior_color",
            "interior_color",
            "status",

            # Production
            "manufacturing_year",
            "model_year",

            # Engine
            "engine_capacity_cc",
            "horsepower",
            "torque_nm",

            # Cabin
            "doors",
            "seats",

            # Condition
            "mileage",
            "owner_count",
            "service_history",
            "accident_history",
            "warranty_available",
            "imported",

            # Commercial
            "purchase_price",
            "selling_price",
            "minimum_selling_price",
            "purchase_date",

            # Marketplace
            "featured",
            "published",
            "description",
            "images",
            "documents",

            # Audit
            "created_at",
            "updated_at",
        )

        read_only_fields = fields
