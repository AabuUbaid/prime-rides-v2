from rest_framework import serializers

from .models import Proforma


class ProformaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proforma
        fields = [
            "id",
            "quote",
            "insurance",
            "proforma_number",
            "proforma_date",
            "payment_type",
            "bank_financed_by",
            "lpo",
            "customer_name",
            "customer_mobile",
            "vehicle_make",
            "vehicle_model",
            "vehicle_year",
            "vehicle_chassis_number",
            "vehicle_engine_number",
            "vehicle_mileage",
            "vehicle_price",
            "down_payment",
            "net_finance",
            "vat",
            "created_by",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "quote",
            "proforma_number",
            "payment_type",
            "net_finance",
            "insurance",
            "created_by",
            "created_at",
            "updated_at",
        ]


class ProformaCreateSerializer(serializers.Serializer):
    insurance = serializers.IntegerField()
    proforma_date = serializers.DateField(required=False)
    vat = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        default=0,
    )
    bank_financed_by = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    lpo = serializers.CharField(
        required=False,
        allow_blank=True,
    )


class ProformaUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proforma
        fields = [
            "proforma_date",
            "bank_financed_by",
            "lpo",
            "customer_name",
            "customer_mobile",
            "vehicle_make",
            "vehicle_model",
            "vehicle_year",
            "vehicle_chassis_number",
            "vehicle_engine_number",
            "vehicle_mileage",
            "vehicle_price",
            "down_payment",
            "vat",
        ]