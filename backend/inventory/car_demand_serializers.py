from rest_framework import serializers

from .models import Car, CarDemand


class CarDemandVehicleSerializer(serializers.ModelSerializer):
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
            "asking_price",
            "status",
        )

        read_only_fields = fields


class CarDemandSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    matched_vehicles = CarDemandVehicleSerializer(
        many=True,
        read_only=True,
    )
    matched_vehicle_count = serializers.SerializerMethodField()

    class Meta:
        model = CarDemand

        fields = (
            "id",
            "customer_name",
            "phone",
            "agent",
            "agent_name",
            "created_by",
            "created_by_name",
            "make",
            "model",
            "year_from",
            "year_to",
            "budget",
            "colour",
            "notes",
            "status",
            "matched_vehicles",
            "matched_vehicle_count",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "agent",
            "agent_name",
            "created_by",
            "created_by_name",
            "matched_vehicles",
            "matched_vehicle_count",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {
            "make": {
                "required": True,
                "allow_blank": False,
            },
            "model": {
                "required": True,
                "allow_blank": False,
            },
            "year_from": {
                "required": True,
                "allow_null": False,
            },
            "year_to": {
                "required": True,
                "allow_null": False,
            },
            "colour": {
                "required": True,
                "allow_blank": False,
            },
        }

    def get_agent_name(self, obj):
        return (
            getattr(obj.agent, "full_name", None)
            or getattr(obj.agent, "username", None)
            or str(obj.agent_id)
        )


    def get_created_by_name(self, obj):
        return (
            getattr(obj.created_by, "full_name", None)
            or getattr(obj.created_by, "username", None)
            or str(obj.created_by_id)
        )

    def get_matched_vehicle_count(self, obj):
        return obj.matched_vehicles.count()

    def validate(self, attrs):
        year_from = attrs.get(
            "year_from",
            getattr(self.instance, "year_from", None),
        )

        year_to = attrs.get(
            "year_to",
            getattr(self.instance, "year_to", None),
        )

        if (
            year_from is not None
            and year_to is not None
            and year_from > year_to
        ):
            raise serializers.ValidationError(
                {
                    "year_to": (
                        "Year To must be greater than or equal "
                        "to Year From."
                    )
                }
            )

        return attrs
    
    def validate_phone(self, value):
        value = value.strip()

        if not value.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only digits."
            )

        if len(value) < 7 or len(value) > 15:
            raise serializers.ValidationError(
                "Phone number must be between 7 and 15 digits."
            )

        return value
    
    def validate_budget(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Budget must be greater than or equal to zero."
            )

        return value
    def validate_status(self, value):
        if self.instance and self.instance.status == "closed":
            if value != "closed":
                raise serializers.ValidationError(
                    "Closed demands cannot be reopened."
                )

        return value
    def validate_make(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Make is required."
            )

        return value


    def validate_model(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Model is required."
            )

        return value


    def validate_colour(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Colour is required."
            )

        return value

class CarDemandVehicleLinkSerializer(serializers.Serializer):
    vehicle_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )

    def validate_vehicle_ids(self, vehicle_ids):
        vehicles = Car.objects.filter(
            id__in=vehicle_ids,
            status=Car.Status.AVAILABLE,
        )

        found_ids = set(
            vehicles.values_list("id", flat=True)
        )

        requested_ids = set(vehicle_ids)

        missing_ids = requested_ids - found_ids

        if missing_ids:
            raise serializers.ValidationError(
                "All vehicles must exist and have available status."
            )

        return vehicle_ids