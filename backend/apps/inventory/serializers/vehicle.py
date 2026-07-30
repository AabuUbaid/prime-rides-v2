from rest_framework import serializers

from apps.inventory.models import Vehicle


class VehicleListSerializer(serializers.ModelSerializer):

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

    status = serializers.CharField(
        source="status.name",
        read_only=True,
    )

    class Meta:
        model = Vehicle

        fields = (
            "id",
            "stock_number",
            "manufacturer",
            "vehicle_model",
            "generation",
            "variant",
            "manufacturing_year",
            "mileage",
            "selling_price",
            "status",
            "published",
            "featured",
        )