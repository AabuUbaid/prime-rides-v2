from rest_framework import serializers

from .models import Company, CompanyBranch


class CompanyBranchSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
    )

    class Meta:
        model = CompanyBranch
        fields = [
            "id",
            "company",
            "name",
            "address",
            "contact_mobile",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class CompanySerializer(serializers.ModelSerializer):
    branches = CompanyBranchSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Company
        fields = [
            "id",
            "legal_entity_name",
            "tax_registration_number",
            "showroom_address",
            "main_contact_mobile",
            "default_currency",
            "default_regional_spec",
            "is_active",
            "branches",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "branches",
            "created_at",
            "updated_at",
        ]