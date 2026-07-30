from rest_framework import serializers

from apps.accounts.models import User
from apps.crm.models import Customer, Lead
from apps.crm.serializers.customer import CustomerListSerializer
from apps.inventory.models import Vehicle
from apps.inventory.serializers import VehicleListSerializer


class LeadListSerializer(serializers.ModelSerializer):
    customer = CustomerListSerializer(read_only=True)
    interested_vehicle = VehicleListSerializer(read_only=True)
    assigned_to = serializers.CharField(source="assigned_to.email", read_only=True)

    class Meta:
        model = Lead
        fields = (
            "id",
            "customer",
            "interested_vehicle",
            "assigned_to",
            "source",
            "status",
            "priority",
            "budget_min",
            "budget_max",
            "expected_purchase_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class LeadDetailSerializer(serializers.ModelSerializer):
    customer = CustomerListSerializer(read_only=True)
    interested_vehicle = VehicleListSerializer(read_only=True)
    assigned_to = serializers.CharField(source="assigned_to.email", read_only=True)

    class Meta:
        model = Lead
        fields = (
            "id",
            "customer",
            "interested_vehicle",
            "assigned_to",
            "source",
            "status",
            "priority",
            "budget_min",
            "budget_max",
            "expected_purchase_date",
            "trade_in_vehicle",
            "notes",
            "lost_reason",
            "converted_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class LeadWriteSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.active())
    interested_vehicle = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.active(),
        required=False,
        allow_null=True,
    )
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.active(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Lead
        fields = (
            "customer",
            "interested_vehicle",
            "assigned_to",
            "source",
            "status",
            "priority",
            "budget_min",
            "budget_max",
            "expected_purchase_date",
            "trade_in_vehicle",
            "notes",
            "lost_reason",
        )


class LeadStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Lead._meta.get_field("status").choices)
    lost_reason = serializers.CharField(required=False, allow_blank=True)
