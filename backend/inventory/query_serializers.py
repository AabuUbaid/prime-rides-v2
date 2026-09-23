from rest_framework import serializers


class CarListQuerySerializer(serializers.Serializer):

    search = serializers.CharField(
        required=False,
    )

    status = serializers.CharField(
        required=False,
    )
    make = serializers.CharField(
        required=False,
    )
    vehicle_type = serializers.CharField(
        required=False,
    )

    source = serializers.CharField(
        required=False,
    )

    supplier = serializers.CharField(
        required=False,
    )

    year = serializers.IntegerField(
        required=False,
    )

    highlight_public = serializers.BooleanField(
        required=False,
        allow_null=True,

    )

    min_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
    )

    max_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
    )

    min_mileage = serializers.IntegerField(
        required=False,
    )

    max_mileage = serializers.IntegerField(
        required=False,
    )
    age = serializers.IntegerField(
        required=False,
        min_value=0,
    )

    aged_90_plus = serializers.BooleanField(
        required=False,
    )

    ordering = serializers.ChoiceField(
        choices=[
            "stock_id",
            "-stock_id",
            "year",
            "-year",
            "asking_price",
            "-asking_price",
            "purchase_cost",
            "-purchase_cost",
            "mileage",
            "-mileage",
            "created_at",
            "-created_at",
            "make",
            "-make",
        ],
        required=False,
        default="-created_at",
    )

    def validate(self, attrs):

        min_price = attrs.get("min_price")
        max_price = attrs.get("max_price")

        if (
            min_price is not None
            and max_price is not None
            and min_price > max_price
        ):
            raise serializers.ValidationError(
                {
                    "price_range":
                        "Minimum price cannot be greater than maximum price."
                }
            )

        min_mileage = attrs.get("min_mileage")
        max_mileage = attrs.get("max_mileage")

        if (
            min_mileage is not None
            and max_mileage is not None
            and min_mileage > max_mileage
        ):
            raise serializers.ValidationError(
                {
                    "mileage_range":
                        "Minimum mileage cannot be greater than maximum mileage."
                }
            )

        return attrs
    
    