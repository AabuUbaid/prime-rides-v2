from rest_framework import serializers

from apps.inventory.models import Vehicle

from ..base import BaseModelSerializer


class VehicleListSerializer(BaseModelSerializer):
    """
    Lightweight serializer for inventory listing.
    Optimized for GET /vehicles/
    """

    manufacturer = serializers.CharField(
        source="vehicle_model.manufacturer.name",
        read_only=True,
    )

    vehicle_model = serializers.CharField(
        source="vehicle_model.name",
        read_only=True,
    )

    generation = serializers.CharField(
        source="generation.code",
        read_only=True,
    )

    variant = serializers.CharField(
        source="variant.name",
        read_only=True,
    )

    fuel_type = serializers.CharField(
        source="fuel_type.name",
        read_only=True,
    )

    transmission = serializers.CharField(
        source="transmission.name",
        read_only=True,
    )

    drive_type = serializers.CharField(
        source="drive_type.name",
        read_only=True,
    )

    body_type = serializers.CharField(
        source="body_type.name",
        read_only=True,
    )

    engine_type = serializers.CharField(
        source="engine_type.name",
        read_only=True,
    )

    exterior_color = serializers.CharField(
        source="exterior_color.name",
        read_only=True,
    )

    interior_color = serializers.CharField(
        source="interior_color.name",
        read_only=True,
    )

    status = serializers.CharField(
        source="status.name",
        read_only=True,
    )

    class Meta:
        model = Vehicle

        fields = (
            "id",

            # Identity
            "stock_number",
            "slug",

            # Vehicle
            "manufacturer",
            "vehicle_model",
            "generation",
            "variant",

            # Production
            "manufacturing_year",
            "model_year",

            # Specs
            "fuel_type",
            "transmission",
            "drive_type",
            "body_type",
            "engine_type",

            # Condition
            "mileage",

            # Colors
            "exterior_color",
            "interior_color",

            # Pricing
            "selling_price",

            # Marketplace
            "featured",
            "published",

            # Status
            "status",

            # Audit
            "created_at",
            "updated_at",
        )

        read_only_fields = fields