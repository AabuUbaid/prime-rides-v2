from rest_framework import serializers

from .models import Company, CompanyBranch, CompanyDocument


class CompanyBranchSerializer(serializers.ModelSerializer):
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
            "company",
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
            "trade_license_number",
            "trade_license_expiry_date",
            "tax_registration_number",
            "showroom_address",
            "main_contact_mobile",
            "corporate_email",
            "official_phone",
            "emirate",
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
        
class CompanyDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CompanyDocument
        fields = [
            "id",
            "company",
            "name",
            "file",
            "uploaded_by",
            "uploaded_by_name",
            "uploaded_at",
        ]
        read_only_fields = [
            "id",
            "company",
            "uploaded_by",
            "uploaded_by_name",
            "uploaded_at",
        ]

    def get_uploaded_by_name(self, obj):
        user = obj.uploaded_by

        if not user:
            return None

        return (
            getattr(user, "get_full_name", lambda: "")()
            or getattr(user, "username", None)
            or getattr(user, "email", None)
        )