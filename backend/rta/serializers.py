from rest_framework import serializers

from .models import RTARecord, RTADocument


class RTARecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RTARecord

        fields = [
            "id",
            "record_type",
            "status",
            "rta_date",

            # Relationships
            "quote",
            "car",
            "customer",
            "company",
            "branch",

            # Parties
            "first_party_name",
            "first_party_role",
            "second_party_name",
            "second_party_role",
            "second_party_mobile",

            # Purchase supplier information
            "supplier_name",
            "supplier_mobile",
            "supplier_address",
            "supplier_trade_license_number",

            # Company snapshot
            "company_legal_name",
            "trade_license_number",
            "company_address",

            # Vehicle snapshot
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_variant",
            "vehicle_type",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_country_of_manufacture",
            "vehicle_chassis_number",
            "vehicle_engine_number",

            # RTA-specific fields
            "rta_reference_number",
            "first_party_signatory_name",
            "second_party_signatory_name",
            "notes",

            # Historical snapshot
            "snapshot_data",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",

            # Automatically generated party data
            "first_party_name",
            "first_party_role",
            "second_party_name",
            "second_party_role",
            "second_party_mobile",

            # Automatically generated company snapshot
            "company_legal_name",
            "trade_license_number",
            "company_address",

            # Automatically generated vehicle snapshot
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_variant",
            "vehicle_type",
            "vehicle_year",
            "vehicle_colour",
            "vehicle_country_of_manufacture",
            "vehicle_chassis_number",
            "vehicle_engine_number",

            # Historical snapshot must not be manually changed
            "snapshot_data",
        ]

    def validate(self, attrs):
        record_type = attrs.get(
            "record_type",
            getattr(self.instance, "record_type", None),
        )

        quote = attrs.get(
            "quote",
            getattr(self.instance, "quote", None),
        )

        car = attrs.get(
            "car",
            getattr(self.instance, "car", None),
        )

        customer = attrs.get(
            "customer",
            getattr(self.instance, "customer", None),
        )

        company = attrs.get(
            "company",
            getattr(self.instance, "company", None),
        )

        # -------------------------------------------------
        # Required relationships
        # -------------------------------------------------

        if not car:
            raise serializers.ValidationError(
                {
                    "car": "Vehicle is required.",
                }
            )

        if not company:
            raise serializers.ValidationError(
                {
                    "company": "Company is required.",
                }
            )

        # -------------------------------------------------
        # PURCHASE
        # -------------------------------------------------

        if record_type == RTARecord.RecordType.PURCHASE:
            # Purchase RTA is created directly from Inventory.
            if quote:
                raise serializers.ValidationError(
                    {
                        "quote": (
                            "Quote must not be supplied "
                            "for a purchase RTA record."
                        ),
                    }
                )

            supplier_name = attrs.get(
                "supplier_name",
                getattr(self.instance, "supplier_name", ""),
            )

            if not supplier_name:
                raise serializers.ValidationError(
                    {
                        "supplier_name": (
                            "Supplier name is required for "
                            "a purchase RTA record."
                        ),
                    }
                )

            duplicate_queryset = RTARecord.objects.filter(
                car=car,
                record_type=record_type,
            )

        # -------------------------------------------------
        # SALE
        # -------------------------------------------------

        elif record_type == RTARecord.RecordType.SALE:
            if not quote:
                raise serializers.ValidationError(
                    {
                        "quote": (
                            "Quote is required for "
                            "a sale RTA record."
                        ),
                    }
                )

            quote_car = getattr(quote, "car", None)

            if not quote_car:
                raise serializers.ValidationError(
                    {
                        "quote": (
                            "The selected quote is not "
                            "associated with a vehicle."
                        ),
                    }
                )

            if quote_car.pk != car.pk:
                raise serializers.ValidationError(
                    {
                        "car": (
                            "The selected vehicle does not "
                            "match the vehicle associated with "
                            "the quote."
                        ),
                    }
                )

            if not customer:
                raise serializers.ValidationError(
                    {
                        "customer": (
                            "Customer is required for "
                            "a sale RTA record."
                        ),
                    }
                )

            duplicate_queryset = RTARecord.objects.filter(
                quote=quote,
                record_type=record_type,
            )

        else:
            raise serializers.ValidationError(
                {
                    "record_type": "Invalid RTA record type.",
                }
            )

        # -------------------------------------------------
        # Duplicate protection
        # -------------------------------------------------

        if self.instance:
            duplicate_queryset = duplicate_queryset.exclude(
                pk=self.instance.pk,
            )

        if duplicate_queryset.exists():
            if record_type == RTARecord.RecordType.PURCHASE:
                raise serializers.ValidationError(
                    {
                        "car": (
                            "A purchase RTA record already "
                            "exists for this vehicle."
                        ),
                    }
                )

            raise serializers.ValidationError(
                {
                    "quote": (
                        "A sale RTA record already exists "
                        "for this quote."
                    ),
                }
            )

        return attrs
    
    
class RTADocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RTADocument

        fields = [
            "id",
            "rta_record",
            "document_type",
            "file",
            "original_filename",
            "mime_type",
            "file_size",
            "uploaded_by",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "original_filename",
            "mime_type",
            "file_size",
            "uploaded_by",
            "created_at",
        ]

    def validate_file(self, value):
        allowed_types = {
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        content_type = getattr(value, "content_type", None)

        if content_type not in allowed_types:
            raise serializers.ValidationError(
                "Only PDF, JPEG, PNG, and WEBP files are allowed."
            )

        max_size = 10 * 1024 * 1024  # 10 MB

        if value.size > max_size:
            raise serializers.ValidationError(
                "File size must not exceed 10 MB."
            )

        return value