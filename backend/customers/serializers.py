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

    def validate(self, attrs):
        customer = self.context.get("customer")

        if (
            attrs.get("category")
            == CustomerDocument.Category.COMPANY_TRADE_LICENSE
        ):
            if (
                customer is None
                or customer.customer_type != Customer.CustomerType.COMPANY
            ):
                raise serializers.ValidationError(
                    {
                        "category": (
                            "Company Trade License can only be uploaded "
                            "for company customers."
                        )
                    }
                )

        return attrs
    def validate_document(
        self,
        value,
    ):
        allowed_extensions = {
            ".pdf",
            ".jpg",
            ".jpeg",
            ".png",
        }

        name = value.name.lower()

        if not any(
            name.endswith(extension)
            for extension in allowed_extensions
        ):
            raise serializers.ValidationError(
                "Only PDF, JPG, JPEG, and PNG files are supported."
            )

        max_size = 10 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "Document size must not exceed 10 MB."
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

    email = serializers.EmailField(
        required=False,
        allow_blank=True,
    )

    documents = CustomerDocumentCreateSerializer(
        many=True,
        required=False,
    )
    customer_type = serializers.ChoiceField(
        choices=Customer.CustomerType.choices,
        required=False,
        default=Customer.CustomerType.INDIVIDUAL,
    )

    company_name = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
    )

    trn = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )

    trade_license_number = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
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
    def validate(self, attrs):
        customer_type = attrs.get(
            "customer_type",
            Customer.CustomerType.INDIVIDUAL,
        )

        company_name = attrs.get(
            "company_name",
            "",
        ).strip()

        trn = attrs.get(
            "trn",
            "",
        ).strip()

        trade_license_number = attrs.get(
            "trade_license_number",
            "",
        ).strip()

        if customer_type == Customer.CustomerType.COMPANY:
            if not company_name:
                raise serializers.ValidationError(
                    {
                        "company_name": (
                            "Company name is required for company customers."
                        )
                    }
                )

            if not trn:
                raise serializers.ValidationError(
                    {
                        "trn": (
                            "TRN is required for company customers."
                        )
                    }
                )

            if not trade_license_number:
                raise serializers.ValidationError(
                    {
                        "trade_license_number": (
                            "Trade licence number is required "
                            "for company customers."
                        )
                    }
                )

        attrs["company_name"] = company_name
        attrs["trn"] = trn
        attrs["trade_license_number"] = trade_license_number

        return attrs


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

    email = serializers.EmailField(
        required=False,
        allow_blank=True,
    )
    customer_type = serializers.ChoiceField(
        choices=Customer.CustomerType.choices,
        required=False,
    )

    company_name = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
    )

    trn = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )

    trade_license_number = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )
    
    def validate(self, attrs):
        customer_type = attrs.get(
            "customer_type",
            getattr(
                self.instance,
                "customer_type",
                Customer.CustomerType.INDIVIDUAL,
            ),
        )

        company_name = attrs.get(
            "company_name",
            getattr(self.instance, "company_name", ""),
        ).strip()

        trn = attrs.get(
            "trn",
            getattr(self.instance, "trn", ""),
        ).strip()

        trade_license_number = attrs.get(
            "trade_license_number",
            getattr(
                self.instance,
                "trade_license_number",
                "",
            ),
        ).strip()

        if customer_type == Customer.CustomerType.COMPANY:
            if not company_name:
                raise serializers.ValidationError(
                    {
                        "company_name": (
                            "Company name is required for company customers."
                        )
                    }
                )

            if not trn:
                raise serializers.ValidationError(
                    {
                        "trn": (
                            "TRN is required for company customers."
                        )
                    }
                )

            if not trade_license_number:
                raise serializers.ValidationError(
                    {
                        "trade_license_number": (
                            "Trade license number is required "
                            "for company customers."
                        )
                    }
                )

        attrs["company_name"] = company_name
        attrs["trn"] = trn
        attrs["trade_license_number"] = trade_license_number

        return attrs


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
            "customer_type",
            "customer_name",
            "company_name",
            "trn",
            "trade_license_number",
            "phone_number",
            "email",
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
            "email",
            "agent_id",
            "documents",
            "quotes",
            "customer_type",
            "company_name",
            "trn",
            "trade_license_number",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields
