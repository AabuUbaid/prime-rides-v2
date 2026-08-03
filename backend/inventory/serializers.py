from rest_framework import serializers

from .models import (
    Car,
    CarExpense,
    CarImage,
)


class CarCreateSerializer(serializers.ModelSerializer):
    stock_id = serializers.ReadOnlyField()
    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
    )
    class Meta:
        model = Car
        fields = (
            "id",
            "stock_id",
            "make",
            "model",
            "variant",
            "colour",
            "year",
            "purchase_cost",
            "asking_price",
            "least_selling_price",
            "status",
            "mileage",
            "source",
            "supplier",
            "highlight_public",
            "chassis_number",
            "engine_number",
            "possession_certificate",
            "images",
        )

        extra_kwargs = {
            # Required for vehicle creation
            "make": {"required": True},
            "model": {"required": True},
            "variant": {"required": True},
            "colour": {"required": True},
            "year": {"required": True},
            "supplier": {"required": False},

            # Completed later
            "purchase_cost": {"required": False, "allow_null": True},
            "asking_price": {"required": False, "allow_null": True},
            "least_selling_price": {"required": False, "allow_null": True},
            "status": {"required": False},
            "mileage": {"required": False, "allow_null": True},
            "source": {"required": False},
            "highlight_public": {"required": False},
            "chassis_number": {"required": False},
            "engine_number": {"required": False},
            "possession_certificate": {"required": False},
        }

    def validate(self, attrs):
        purchase = attrs.get("purchase_cost")
        asking = attrs.get("asking_price")
        least = attrs.get("least_selling_price")

        if purchase is not None and asking is not None:
            if purchase > asking:
                raise serializers.ValidationError({
                    "asking_price": "Asking price must be greater than purchase cost."
                })

        if least is not None and asking is not None:
            if least > asking:
                raise serializers.ValidationError({
                    "least_selling_price": "Least selling price cannot exceed asking price."
                })

        return attrs


class CarImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = CarImage

        fields = (
            "id",
            "image",
            "is_cover",
        )

        read_only_fields = (
            "id",
        )

class CarListSerializer(serializers.ModelSerializer):

    images = CarImageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Car

        fields = (
            "id",
            "stock_id",
            "year",
            "make",
            "model",
            "variant",
            "colour",
            "status",
            "asking_price",
            "mileage",
            "created_at",
            "images",
        )

class CarDetailSerializer(serializers.ModelSerializer):

    images = CarImageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Car

        fields = (
            "id",
            "stock_id",
            "year",
            "make",
            "model",
            "variant",
            "colour",
            "purchase_cost",
            "asking_price",
            "least_selling_price",
            "status",
            "mileage",
            "source",
            "highlight_public",
            "chassis_number",
            "engine_number",
            "possession_certificate",
            "created_at",
            "updated_at",
            "images",
        )

class CarUpdateSerializer(serializers.ModelSerializer):

    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Car

        fields = (
            "make",
            "model",
            "variant",
            "colour",
            "year",
            "purchase_cost",
            "asking_price",
            "least_selling_price",
            "status",
            "mileage",
            "source",
            "source_specify",
            "supplier",
            "highlight_public",
            "chassis_number",
            "engine_number",
            "possession_certificate",
            "images",
        )

    def validate(self, attrs):
        purchase = attrs.get("purchase_cost")
        asking = attrs.get("asking_price")
        least = attrs.get("least_selling_price")

        if purchase is not None and asking is not None:
            if purchase > asking:
                raise serializers.ValidationError(
                    {
                        "asking_price":
                            "Asking price must be greater than purchase cost."
                    }
                )

        if least is not None and asking is not None:
            if least > asking:
                raise serializers.ValidationError(
                    {
                        "least_selling_price":
                            "Least selling price cannot exceed asking price."
                    }
                )

        return attrs

