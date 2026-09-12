from rest_framework import serializers

from .models import Insurance, InsurancePolicy
from .services import get_policy_expiry_info


class InsurancePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = InsurancePolicy
        fields = [
            "id",
            "cycle_number",
            "policy_number",
            "start_date",
            "expiry_date",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "cycle_number",
            "policy_number",
            "start_date",
            "expiry_date",
            "is_active",
            "created_at",
            "updated_at",
        ]


class InsuranceSerializer(serializers.ModelSerializer):
    days_remaining = serializers.SerializerMethodField()
    expiry_status = serializers.SerializerMethodField()
    policy_cycles = InsurancePolicySerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Insurance
        fields = [
            "id",
            "quote",
            "bank_loan",
            "cash_deal",
            "customer_name",
            "customer_mobile",
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_chassis_number",
            "vehicle_engine_number",
            "vehicle_mileage",
            "payment_method",
            "application_status",
            "policy_number",
            "expiry_date",
            "days_remaining",
            "expiry_status",
            "renewal_status",
            "policy_cycles",
            "remark",
            "created_by",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "quote",
            "bank_loan",
            "cash_deal",
            "customer_name",
            "customer_mobile",
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_chassis_number",
            "vehicle_engine_number",
            "vehicle_mileage",
            "payment_method",
            "days_remaining",
            "expiry_status",
            "policy_cycles",
            "renewal_status",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_days_remaining(self, obj):
        if not obj.expiry_date:
            return None

        return get_policy_expiry_info(
            insurance=obj,
        )["days_remaining"]


    def get_expiry_status(self, obj):
        if not obj.expiry_date:
            return None

        return get_policy_expiry_info(
            insurance=obj,
        )["expiry_status"]