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

from apps.inventory.services.vehicle import update_vehicle

from ..base import BaseModelSerializer


class VehicleUpdateSerializer(BaseModelSerializer):
    """
    Serializer for updating vehicles.

    Business logic is delegated to the service layer.
    """

    vehicle_model = serializers.PrimaryKeyRelatedField(
        queryset=VehicleModel.objects.active(),
        required=False,
    )

    generation = serializers.PrimaryKeyRelatedField(
        queryset=Generation.objects.active(),
        required=False,
    )

    variant = serializers.PrimaryKeyRelatedField(
        queryset=Variant.objects.active(),
        required=False,
    )

    fuel_type = serializers.PrimaryKeyRelatedField(
        queryset=FuelType.objects.active(),
        required=False,
    )

    transmission = serializers.PrimaryKeyRelatedField(
        queryset=Transmission.objects.active(),
        required=False,
    )

    drive_type = serializers.PrimaryKeyRelatedField(
        queryset=DriveType.objects.active(),
        required=False,
    )

    body_type = serializers.PrimaryKeyRelatedField(
        queryset=BodyType.objects.active(),
        required=False,
    )

    engine_type = serializers.PrimaryKeyRelatedField(
        queryset=EngineType.objects.active(),
        required=False,
    )

    exterior_color = serializers.PrimaryKeyRelatedField(
        queryset=Color.objects.active(),
        required=False,
    )

    interior_color = serializers.PrimaryKeyRelatedField(
        queryset=InteriorColor.objects.active(),
        required=False,
    )

    status = serializers.PrimaryKeyRelatedField(
        queryset=VehicleStatus.objects.active(),
        required=False,
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

    def update(self, instance, validated_data):
        """
        Delegate update logic to the service layer.
        """
        return update_vehicle(
            vehicle=instance,
            user=self.context["request"].user,
            **validated_data,
        )
