from rest_framework import serializers
from datetime import date

from .models import (
    Car,
    CarExpense,
    CarImage,
)


class CarCreateSerializer(serializers.ModelSerializer):
    stock_id = serializers.ReadOnlyField()
    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
    )

    def validate_images(self, images):

        allowed_types = (
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
            "image/pjpeg"
        )

        max_size = 10 * 1024 * 1024

        for image in images:

            if image.content_type not in allowed_types:

                raise serializers.ValidationError(
                    "Only JPG, PNG and WEBP images are allowed."
                )

            if image.size > max_size:

                raise serializers.ValidationError(
                    "Maximum image size is 10 MB."
                )

        return images

    def validate_possession_certificate(self, file):

        allowed_types = (
            "application/pdf",
            "image/jpeg",
            "image/png",
        )

        max_size = 10 * 1024 * 1024

        if file.content_type not in allowed_types:

            raise serializers.ValidationError(
                "Certificate must be PDF, JPG or PNG."
            )

        if file.size > max_size:

            raise serializers.ValidationError(
                "Maximum certificate size is 10 MB."
            )

        return file


    class Meta:
        model = Car
        fields = (
            "id",
            "stock_id",
            "make",
            "model",
            "variant",
            "colour",
            "year",
            "purchase_cost",
            "asking_price",
            "least_selling_price",
            "status",
            "mileage",
            "source",
            "source_specify",
            "supplier",
            "highlight_public",
            "chassis_number",
            "engine_number",
            "possession_certificate",
            "images",
            
        )

        extra_kwargs = {
            # Required for vehicle creation
            "make": {"required": True, "allow_blank": False},
            "model": {"required": True, "allow_blank": False},
            "variant": {"required": True, "allow_blank": False},
            "colour": {"required": True, "allow_blank": False},
            "year": {"required": True, "allow_null": True},
            "supplier": {"required": False},

            # Completed later
            "purchase_cost": {"required": False, "allow_null": True},
            "asking_price": {"required": False, "allow_null": True},
            "least_selling_price": {"required": False, "allow_null": True},
            "status": {"required": False},
            "mileage": {"required": False, "allow_null": True},
            "source": {"required": False},
            "highlight_public": {"required": False},
            "chassis_number": {"required": False},
            "engine_number": {"required": False},
            "possession_certificate": {"required": False},
        }

    def validate(self, attrs):
        purchase = attrs.get("purchase_cost")
        asking = attrs.get("asking_price")
        least = attrs.get("least_selling_price")

        if purchase is not None and asking is not None:
            if purchase > asking:
                raise serializers.ValidationError({
                    "asking_price": "Asking price must be greater than purchase cost."
                })

        if least is not None and asking is not None:
            if least > asking:
                raise serializers.ValidationError({
                    "least_selling_price": "Least selling price cannot exceed asking price."
                })

        chassis = attrs.get(
            "chassis_number",
        )

        if chassis:

            exists = Car.objects.filter(
                chassis_number=chassis,
            ).exists()

            if exists:

                raise serializers.ValidationError(
                    {
                        "chassis_number":
                            "A vehicle with this chassis number already exists."
                    }
                )

        engine = attrs.get(
            "engine_number",
        )

        if engine:

            exists = (
                Car.objects
                .filter(
                    engine_number=engine,
                )
                .exists()
            )

            if exists:

                raise serializers.ValidationError(
                    {
                        "engine_number":
                            "A vehicle with this engine number already exists."
                    }
                )

        year = attrs.get("year")

        if year is not None:

            current_year = date.today().year

            if year > current_year:

                raise serializers.ValidationError(
                    {
                        "year":
                            "Vehicle year cannot be greater than the current year."
                    }
                )

        numeric_fields = (
            "purchase_cost",
            "asking_price",
            "least_selling_price",
            "mileage",
        )

        for field in numeric_fields:

            value = attrs.get(field)

            if value is not None and value < 0:

                raise serializers.ValidationError(
                    {
                        field: "Cannot be negative."
                    }
                )

        return attrs


class CarImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = CarImage

        fields = (
            "id",
            "image",
            "is_cover",
        )

        read_only_fields = (
            "id",
        )

class CarExpenseSerializer(serializers.ModelSerializer):

    class Meta:
        model = CarExpense

        fields = (
            "id",
            "description",
            "amount",
        )

class ExpenseSummarySerializer(serializers.Serializer):

    expense_count = serializers.IntegerField()

    total_expenses = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    net_cost = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

class CarListSerializer(serializers.ModelSerializer):

    images = CarImageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Car

        fields = (
            "id",
            "stock_id",
            "year",
            "make",
            "model",
            "variant",
            "colour",
            "status",
            "asking_price",
            "mileage",
            "created_at",
            "images",
        )

class CarDetailSerializer(serializers.ModelSerializer):

    images = CarImageSerializer(
        many=True,
        read_only=True,
    )

    expenses = CarExpenseSerializer(
        many=True,
        read_only=True,
    )

    expense_summary = serializers.SerializerMethodField()

    def get_expense_summary(self, obj):

        from .selectors import InventorySelector

        summary = InventorySelector.get_expense_summary(obj)

        return ExpenseSummarySerializer(summary).data
    

    class Meta:
        model = Car

        fields = (
            "id",
            "stock_id",
            "year",
            "make",
            "model",
            "variant",
            "colour",
            "purchase_cost",
            "asking_price",
            "least_selling_price",
            "status",
            "mileage",
            "source",
            "source_specify",
            "supplier",
            "highlight_public",
            "chassis_number",
            "engine_number",
            "possession_certificate",
            "created_at",
            "updated_at",
            "images",
            "expenses",
            "expense_summary",
        )

class CarUpdateSerializer(serializers.ModelSerializer):

    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
    )

    remove_certificate = serializers.BooleanField(
        required=False,
        default=False,
        write_only=True,
    )


    def validate_images(self, images):

        allowed_types = (
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
            "image/pjpeg"
        )

        max_size = 10 * 1024 * 1024

        for image in images:

            if image.content_type not in allowed_types:

                raise serializers.ValidationError(
                    "Only JPG, PNG and WEBP images are allowed."
                )

            if image.size > max_size:

                raise serializers.ValidationError(
                    "Maximum image size is 10 MB."
                )

        return images
    

    def validate_possession_certificate(self, file):

        allowed_types = (
            "application/pdf",
            "image/jpeg",
            "image/png",
        )

        max_size = 10 * 1024 * 1024

        if file.content_type not in allowed_types:

            raise serializers.ValidationError(
                "Certificate must be PDF, JPG or PNG."
            )

        if file.size > max_size:

            raise serializers.ValidationError(
                "Maximum certificate size is 10 MB."
            )

        return file

    class Meta:
        model = Car

        fields = (
            "make",
            "model",
            "variant",
            "colour",
            "year",
            "purchase_cost",
            "asking_price",
            "least_selling_price",
            "status",
            "mileage",
            "source",
            "source_specify",
            "supplier",
            "highlight_public",
            "chassis_number",
            "engine_number",
            "possession_certificate",
            "remove_certificate",
            "images",
        )

    def validate(self, attrs):
        purchase = attrs.get("purchase_cost")
        asking = attrs.get("asking_price")
        least = attrs.get("least_selling_price")

        if purchase is not None and asking is not None:
            if purchase > asking:
                raise serializers.ValidationError(
                    {
                        "asking_price":
                            "Asking price must be greater than purchase cost."
                    }
                )

        if least is not None and asking is not None:
            if least > asking:
                raise serializers.ValidationError(
                    {
                        "least_selling_price":
                            "Least selling price cannot exceed asking price."
                    }
                )
        chassis = attrs.get(
            "chassis_number",
        )

        if chassis:

            exists = (
                Car.objects
                .exclude(
                    pk=self.instance.pk,
                )
                .filter(
                    chassis_number=chassis,
                )
                .exists()
            )

            if exists:

                raise serializers.ValidationError(
                    {
                        "chassis_number":
                            "A vehicle with this chassis number already exists."
                    }
                )

        engine = attrs.get(
            "engine_number",
        )

        if engine:

            exists = (
                Car.objects
                .exclude(
                    pk=self.instance.pk,
                )
                .filter(
                    engine_number=engine,
                )
                .exists()
            )

            if exists:

                raise serializers.ValidationError(
                    {
                        "engine_number":
                            "A vehicle with this engine number already exists."
                    }
                )

        year = attrs.get("year")

        if year is not None:

            current_year = date.today().year

            if year > current_year:

                raise serializers.ValidationError(
                    {
                        "year":
                            "Vehicle year cannot be greater than the current year."
                    }
                )

        numeric_fields = (
            "purchase_cost",
            "asking_price",
            "least_selling_price",
            "mileage",
        )

        for field in numeric_fields:

            value = attrs.get(field)

            if value is not None and value < 0:

                raise serializers.ValidationError(
                    {
                        field: "Cannot be negative."
                    }
                )

        return attrs

class ImageReorderSerializer(serializers.Serializer):

    image_order = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
    )


class BulkImageDeleteSerializer(serializers.Serializer):

    image_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
    )

class BulkVehicleDeleteSerializer(serializers.Serializer):

    vehicle_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )


class BulkVehicleRowSerializer(serializers.ModelSerializer):

    class Meta:
        model = Car

        fields = [
            "year",
            "make",
            "model",
            "variant",
            "colour",
            "chassis_number",
            "engine_number",
            "purchase_cost",
            "asking_price",
            "least_selling_price",
            "status",
            "mileage",
            "source",
            "source_specify",
            "supplier",
            "highlight_public",
        ]

        extra_kwargs = {

            # -------------------------------------------------
            # Vehicle identity/details
            # -------------------------------------------------

            "year": {
                "required": True,
                "allow_null": False,
            },

            "make": {
                "required": True,
                "allow_null": False,
                "allow_blank": False,
            },

            "model": {
                "required": True,
                "allow_null": False,
                "allow_blank": False,
            },

            "variant": {
                "required": True,
                "allow_null": False,
                "allow_blank": False,
            },

            "colour": {
                "required": True,
                "allow_null": False,
                "allow_blank": False,
            },

            # -------------------------------------------------
            # Identifiers
            #
            # Duplicate validation is handled by
            # InventoryService.validate_bulk_vehicle_identifiers()
            # -------------------------------------------------

            "chassis_number": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "engine_number": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            # -------------------------------------------------
            # Financial fields
            # -------------------------------------------------

            "purchase_cost": {
                "required": False,
                "allow_null": True,
            },

            "asking_price": {
                "required": False,
                "allow_null": True,
            },

            "least_selling_price": {
                "required": False,
                "allow_null": True,
            },

            # -------------------------------------------------
            # Other optional fields
            # -------------------------------------------------

            "mileage": {
                "required": False,
                "allow_null": True,
            },

            "source_specify": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "supplier": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },

            "status": {
                "required": False,
            },

            "source": {
                "required": False,
            },

            "highlight_public": {
                "required": False,
            },
        }

    def validate(self, attrs):

        # -------------------------------------------------
        # REQUIRED VEHICLE IDENTITY
        # -------------------------------------------------

        required_fields = {
            "year": "Year is required.",
            "make": "Make is required.",
            "model": "Model is required.",
            "variant": "Variant is required.",
            "colour": "Colour is required.",
        }

        errors = {}

        for field, message in required_fields.items():

            value = attrs.get(field)

            if value is None:
                errors[field] = message

            elif isinstance(value, str) and not value.strip():
                errors[field] = message

        if errors:
            raise serializers.ValidationError(
                errors
            )

        # -------------------------------------------------
        # OPTIONAL TEXT FIELDS
        # -------------------------------------------------

        text_fields = [
            "chassis_number",
            "engine_number",
            "source_specify",
            "supplier",
        ]

        for field in text_fields:

            if attrs.get(field) is None:
                attrs[field] = ""

        # -------------------------------------------------
        # PRICE VALIDATION
        # -------------------------------------------------

        purchase = attrs.get(
            "purchase_cost"
        )

        asking = attrs.get(
            "asking_price"
        )

        least = attrs.get(
            "least_selling_price"
        )

        if (
            purchase is not None
            and purchase < 0
        ):
            errors = {
                "purchase_cost": "Cannot be negative."
            }

        if (
            asking is not None
            and asking < 0
        ):
            errors = {
                "asking_price": "Cannot be negative."
            }

        if (
            least is not None
            and least < 0
        ):
            errors = {
                "least_selling_price": (
                    "Cannot be negative."
                )
            }

        if errors:
            raise serializers.ValidationError(
                errors
            )

        # -------------------------------------------------
        # PRICE RELATIONSHIPS
        # -------------------------------------------------

        if (
            purchase is not None
            and asking is not None
            and purchase > asking
        ):
            raise serializers.ValidationError(
                {
                    "asking_price": (
                        "Asking price must be greater "
                        "than purchase cost."
                    )
                }
            )

        if (
            least is not None
            and asking is not None
            and least > asking
        ):
            raise serializers.ValidationError(
                {
                    "least_selling_price": (
                        "Least selling price cannot "
                        "exceed asking price."
                    )
                }
            )

        # -------------------------------------------------
        # YEAR VALIDATION
        # -------------------------------------------------

        year = attrs.get("year")

        if year is not None:

            if year > date.today().year:

                raise serializers.ValidationError(
                    {
                        "year": (
                            "Vehicle year cannot be "
                            "greater than the current year."
                        )
                    }
                )

        # -------------------------------------------------
        # MILEAGE VALIDATION
        # -------------------------------------------------

        mileage = attrs.get("mileage")

        if (
            mileage is not None
            and mileage < 0
        ):
            raise serializers.ValidationError(
                {
                    "mileage": "Cannot be negative."
                }
            )

        return attrs


class BulkVehicleImportSerializer(serializers.Serializer):
    file = serializers.FileField(
        required=True,
        write_only=True,
    )

    def validate_file(self, file):
        filename = (
            getattr(file, "name", "") or ""
        ).lower()

        if not filename.endswith(
            (".xlsx", ".csv")
        ):
            raise serializers.ValidationError(
                "Only .xlsx and .csv files are supported."
            )

        return file

