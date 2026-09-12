from rest_framework import serializers

from .models import DeliveryNote


class DeliveryNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryNote
        fields = [
            "id",
            "quote",
            "insurance",
            "delivery_note_number",
            "delivery_date",
            "customer_name",
            "vehicle_make",
            "vehicle_model",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_chassis_number",
            "vehicle_engine_number",
            "vehicle_mileage",
            "quantity",
            "unit",
            "buyer_name",
            "buyer_signature",
            "buyer_signature_date",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "quote",
            "insurance",
            "delivery_note_number",
            "quantity",
            "unit",
            "created_by",
            "created_at",
            "updated_at",
        ]


class DeliveryNoteCreateSerializer(serializers.Serializer):
    insurance = serializers.IntegerField()
    delivery_date = serializers.DateField(required=False)
    buyer_name = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    buyer_signature = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    buyer_signature_date = serializers.DateField(
        required=False,
        allow_null=True,
    )


class DeliveryNoteUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryNote
        fields = [
            "delivery_date",
            "customer_name",
            "vehicle_make",
            "vehicle_model",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_chassis_number",
            "vehicle_engine_number",
            "vehicle_mileage",
            "buyer_name",
            "buyer_signature",
            "buyer_signature_date",
        ]