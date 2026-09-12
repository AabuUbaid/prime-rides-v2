from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from accounts.models import User
from staff.models import Staff

from .models import Lead, LeadActivity


class StaffSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = (
            "id",
            "name",
            "phone",
            "job_role",
            "status",
        )
        read_only_fields = fields


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
        )
        read_only_fields = fields


class LeadActivitySerializer(serializers.ModelSerializer):
    created_by = UserSummarySerializer(
        read_only=True,
    )

    class Meta:
        model = LeadActivity
        fields = (
            "id",
            "lead",
            "note",
            "created_by",
            "created_at",
        )
        read_only_fields = (
            "id",
            "lead",
            "created_by",
            "created_at",
        )


class LeadSerializer(serializers.ModelSerializer):
    created_by = UserSummarySerializer(
        read_only=True,
    )

    assigned_to = StaffSummarySerializer(
        read_only=True,
    )

    is_high_priority = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = (
            "id",
            "phone_number",
            "customer_name",
            "email",
            "enquiry_source",
            "enquiry_status",
            "assigned_to",
            "created_by",
            "purpose",
            "notes",
            "insurance",
            "type_of_car",
            "brand",
            "mode_of_payment",
            "salary",
            "date_of_birth",
            "lead_from",
            "last_activity_at",
            "is_high_priority",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_is_high_priority(self, obj):
        threshold = timezone.now() - timedelta(
            days=7,
        )

        return obj.last_activity_at < threshold


class LeadCreateSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=Staff.objects.filter(
            status=Staff.Status.ACTIVE,
        ),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Lead
        fields = (
            "phone_number",
            "customer_name",
            "email",
            "enquiry_source",
            "enquiry_status",
            "assigned_to",
            "purpose",
            "notes",
            "insurance",
            "type_of_car",
            "brand",
            "mode_of_payment",
            "salary",
            "date_of_birth",
            "lead_from",
        )
        read_only_fields = (
            "created_by",
        )

    def validate_phone_number(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Phone number is required."
            )

        return value

    def validate_customer_name(self, value):
        return value.strip()

    def validate_purpose(self, value):
        return value.strip()

    def validate_notes(self, value):
        return value.strip()

    def validate_insurance(self, value):
        return value.strip()

    def validate_type_of_car(self, value):
        return value.strip()

    def validate_brand(self, value):
        return value.strip()

    def validate_mode_of_payment(self, value):
        return value.strip()

    def validate_lead_from(self, value):
        return value.strip()

    def validate_salary(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Salary cannot be negative."
            )

        return value


class LeadUpdateSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=Staff.objects.filter(
            status=Staff.Status.ACTIVE,
        ),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Lead
        fields = (
            "phone_number",
            "customer_name",
            "email",
            "enquiry_source",
            "enquiry_status",
            "assigned_to",
            "purpose",
            "notes",
            "insurance",
            "type_of_car",
            "brand",
            "mode_of_payment",
            "salary",
            "date_of_birth",
            "lead_from",
        )

    def validate_phone_number(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Phone number is required."
            )

        return value

    def validate_salary(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Salary cannot be negative."
            )

        return value


class LeadActivityCreateSerializer(serializers.Serializer):
    note = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    def validate_note(self, value):
        return value.strip()