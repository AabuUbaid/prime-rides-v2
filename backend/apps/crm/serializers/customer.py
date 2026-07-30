from rest_framework import serializers

from apps.accounts.models import User
from apps.crm.models import Customer


class CustomerListSerializer(serializers.ModelSerializer):
    assigned_to = serializers.CharField(source="assigned_to.email", read_only=True)
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = (
            "id",
            "display_name",
            "customer_type",
            "first_name",
            "last_name",
            "company_name",
            "email",
            "phone_number",
            "preferred_contact_method",
            "city",
            "assigned_to",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class CustomerDetailSerializer(serializers.ModelSerializer):
    assigned_to = serializers.CharField(source="assigned_to.email", read_only=True)
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = (
            "id",
            "display_name",
            "customer_type",
            "first_name",
            "last_name",
            "company_name",
            "email",
            "phone_number",
            "alternate_phone_number",
            "preferred_contact_method",
            "tax_id",
            "date_of_birth",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
            "assigned_to",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class CustomerWriteSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.active(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Customer
        fields = (
            "customer_type",
            "first_name",
            "last_name",
            "company_name",
            "email",
            "phone_number",
            "alternate_phone_number",
            "preferred_contact_method",
            "tax_id",
            "date_of_birth",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
            "assigned_to",
            "notes",
        )
