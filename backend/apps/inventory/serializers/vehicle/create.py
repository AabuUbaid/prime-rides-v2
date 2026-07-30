from rest_framework import serializers

from apps.inventory.models import (
    Vehicle,
    VehicleModel,
    Generation,
    Variant,
    FuelType,
    Transmission,
    DriveType,
    BodyType,
    EngineType,
    Color,
    InteriorColor,
    VehicleStatus,
)

from apps.inventory.services.vehicle import create_vehicle

from ..base import BaseModelSerializer


class VehicleCreateSerializer(BaseModelSerializer):
    """
    Serializer for creating vehicles.

    Business logic is delegated to the service layer.
    """

    vehicle_model = serializers.PrimaryKeyRelatedField(
        queryset=VehicleModel.objects.active()
    )

    generation = serializers.PrimaryKeyRelatedField(
        queryset=Generation.objects.active()
    )

    variant = serializers.PrimaryKeyRelatedField(
        queryset=Variant.objects.active()
    )

    fuel_type = serializers.PrimaryKeyRelatedField(
        queryset=FuelType.objects.active()
    )

    transmission = serializers.PrimaryKeyRelatedField(
        queryset=Transmission.objects.active()
    )

    drive_type = serializers.PrimaryKeyRelatedField(
        queryset=DriveType.objects.active()
    )

    body_type = serializers.PrimaryKeyRelatedField(
        queryset=BodyType.objects.active()
    )

    engine_type = serializers.PrimaryKeyRelatedField(
        queryset=EngineType.objects.active()
    )

    exterior_color = serializers.PrimaryKeyRelatedField(
        queryset=Color.objects.active()
    )

    interior_color = serializers.PrimaryKeyRelatedField(
        queryset=InteriorColor.objects.active()
    )

    status = serializers.PrimaryKeyRelatedField(
        queryset=VehicleStatus.objects.active()
    )

    class Meta:
        model = Vehicle

        fields = (
            "vin",
            "engine_number",
            "registration_number",
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

    def create(self, validated_data):
        """
        Delegate creation to the service layer.
        """
        return create_vehicle(
            user=self.context["request"].user,
            **validated_data,
        )
