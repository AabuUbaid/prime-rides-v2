from rest_framework import serializers

from .models import Customer, CustomerDocument
from quotes.models import Quote

class CustomerDocumentSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = CustomerDocument

        fields = (
            "id",
            "category",
            "document",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )


class CustomerDocumentCreateSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = CustomerDocument

        fields = (
            "category",
            "document",
        )

    def validate_category(
        self,
        value,
    ):
        valid_categories = {
            choice[0]
            for choice in CustomerDocument.Category.choices
        }

        if value not in valid_categories:
            raise serializers.ValidationError(
                "Invalid document category."
            )

        return value


class CustomerCreateSerializer(
    serializers.Serializer
):
    customer_name = serializers.CharField(
        max_length=255,
    )

    phone_number = serializers.CharField(
        max_length=30,
    )

    documents = CustomerDocumentCreateSerializer(
        many=True,
        required=False,
    )

    def validate_customer_name(
        self,
        value,
    ):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Customer name is required."
            )

        return value

    def validate_phone_number(
        self,
        value,
    ):
        value = (
            value.strip()
            .replace(" ", "")
            .replace("-", "")
            .replace("(", "")
            .replace(")", "")
        )

        if not value:
            raise serializers.ValidationError(
                "Phone number is required."
            )

        return value


class CustomerUpdateSerializer(
    serializers.Serializer
):
    customer_name = serializers.CharField(
        max_length=255,
        required=False,
    )

    phone_number = serializers.CharField(
        max_length=30,
        required=False,
    )


class CustomerListSerializer(
    serializers.ModelSerializer
):
    agent_id = serializers.UUIDField(
        source="agent.id",
        read_only=True,
    )

    class Meta:
        model = Customer

        fields = (
            "id",
            "customer_name",
            "phone_number",
            "agent_id",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields

class CustomerQuoteSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Quote

        fields = (
            "id",
            "quote_number",
            "status",
            "price",
            "payment_method",
            "down_payment",
            "extra_down_payment",
            "created_at",
        )

        read_only_fields = fields

class CustomerDetailSerializer(
    serializers.ModelSerializer
):
    agent_id = serializers.UUIDField(
        source="agent.id",
        read_only=True,
    )

    documents = CustomerDocumentSerializer(
        many=True,
        read_only=True,
    )
    quotes = CustomerQuoteSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Customer

        fields = (
            "id",
            "customer_name",
            "phone_number",
            "agent_id",
            "documents",
            "quotes",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields