from rest_framework import serializers

from .models import Car, ProcurementCheck


class ProcurementCheckSerializer(serializers.ModelSerializer):
    car = serializers.PrimaryKeyRelatedField(
        queryset=Car.objects.all(),
        required=False,
        allow_null=True,
    )

    checked_by = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    class Meta:
        model = ProcurementCheck
        fields = [
            "id",
            "car",
            "chassis_number",
            "make",
            "model",
            "range_trim_code",
            "model_year",
            "engine",
            "body_type",
            "mileage",
            "colour",
            "recorded_accidents",
            "no_accidents",
            "condition_notes",
            "checked_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "checked_by",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        car = attrs.get("car")

        # Prevent duplicate procurement checks for the same vehicle.
        if car:
            existing_check = ProcurementCheck.objects.filter(
                car=car
            ).first()

            current_instance = self.instance

            if existing_check and existing_check != current_instance:
                raise serializers.ValidationError({
                    "car": (
                        "A procurement check already exists "
                        "for this vehicle."
                    )
                })

        no_accidents = attrs.get(
            "no_accidents",
            getattr(self.instance, "no_accidents", False)
        )

        recorded_accidents = attrs.get(
            "recorded_accidents",
            getattr(self.instance, "recorded_accidents", None)
        )

        # Validate accident information.
        if no_accidents and recorded_accidents not in (None, 0):
            raise serializers.ValidationError({
                "recorded_accidents": (
                    "Must be 0 or empty when no_accidents is true."
                )
            })

        if recorded_accidents is not None and recorded_accidents > 0:
            if no_accidents:
                raise serializers.ValidationError({
                    "no_accidents": (
                        "Cannot be true when recorded accidents "
                        "are greater than 0."
                    )
                })

        # Non-inventory checks require basic vehicle identification.
        if not car:
            chassis_number = attrs.get(
                "chassis_number",
                getattr(self.instance, "chassis_number", "")
            )
            if chassis_number:
                existing_check = ProcurementCheck.objects.filter(
                    chassis_number=chassis_number
                ).first()

                current_instance = self.instance

                if existing_check and existing_check != current_instance:
                    raise serializers.ValidationError({
                        "chassis_number": (
                            "A procurement check already exists "
                            "for this chassis number."
                        )
                    })
            make = attrs.get(
                "make",
                getattr(self.instance, "make", "")
            )
            model = attrs.get(
                "model",
                getattr(self.instance, "model", "")
            )

            if not any([
                chassis_number,
                make and model,
            ]):
                raise serializers.ValidationError({
                    "vehicle_identification": (
                        "Provide a chassis number or both make and model "
                        "for a non-inventory procurement check."
                    )
                })

        return attrs