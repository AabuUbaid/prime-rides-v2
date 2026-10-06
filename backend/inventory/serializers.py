from rest_framework import serializers
from datetime import date
from decimal import Decimal
from .models import (
    Car,
    CarExpense,
    CarImage,
    SpecialPriceRequest,
    VehicleDocument,
)


SENSITIVE_INVENTORY_FIELDS = {
    "purchase_cost",
    "expenses",
    "expense_summary",
    "supplier",
    "actual_mileage",
    "total_cost",
    "estimated_margin",
    "expenses_total",
}
from datetime import date
from django.utils import timezone


def is_master_request(request):
    return bool(
        request
        and request.user
        and request.user.is_authenticated
        and getattr(request.user, "role", None) == "MASTER"
    )


def remove_sensitive_fields(fields, request):
    if not is_master_request(request):
        for field_name in SENSITIVE_INVENTORY_FIELDS:
            fields.pop(field_name, None)

    return fields

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
            "branch",
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
            "vehicle_type",
            "actual_mileage",
            "service_location",
            
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
            
            "vehicle_type": {
                "required": False,
                "allow_blank": True,
            },

            "actual_mileage": {
                "required": False,
                "allow_null": True,
            },

            "service_location": {
                "required": False,
                "allow_blank": True,
            },
        }

    def validate(self, attrs):
        
        request = self.context.get("request")

        if not is_master_request(request):
            forbidden_fields = (
                "purchase_cost",
                "supplier",
                "actual_mileage",
            )

            submitted_forbidden_fields = [
                field_name
                for field_name in forbidden_fields
                if field_name in self.initial_data
            ]

            if submitted_forbidden_fields:
                raise serializers.ValidationError({
                    field_name: "Only Master users can set this field."
                    for field_name in submitted_forbidden_fields
                })
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
    
class InventoryFinancialFieldsMixin:
    expenses_total = serializers.SerializerMethodField()
    total_cost = serializers.SerializerMethodField()
    estimated_margin = serializers.SerializerMethodField()

    def get_expenses_total(self, obj):
        annotated_total = getattr(
            obj,
            "stock_expenses_total",
            None,
        )

        if annotated_total is not None:
            return annotated_total

        from .selectors import InventorySelector

        summary = InventorySelector.get_expense_summary(obj)
        return summary["total_expenses"]

    def get_total_cost(self, obj):
        purchase_cost = obj.purchase_cost or Decimal("0.00")
        expenses_total = self.get_expenses_total(obj)

        return purchase_cost + expenses_total

    def get_estimated_margin(self, obj):
        asking_price = obj.asking_price or Decimal("0.00")
        total_cost = self.get_total_cost(obj)

        return asking_price - total_cost

class CarListSerializer(
    InventoryFinancialFieldsMixin,
    serializers.ModelSerializer,
):
    expenses_total = serializers.SerializerMethodField()
    total_cost = serializers.SerializerMethodField()
    estimated_margin = serializers.SerializerMethodField()
    images = CarImageSerializer(
        many=True,
        read_only=True,
    )
    
    stock_age_days = serializers.SerializerMethodField()
    is_aged_90_plus = serializers.SerializerMethodField()

    def get_fields(self):
        fields = super().get_fields()

        request = self.context.get("request")

        return remove_sensitive_fields(
            fields,
            request,
        )
        
    def get_stock_age_days(self, obj):
        if not obj.created_at:
            return None

        created_date = timezone.localtime(obj.created_at).date()
        current_date = timezone.localdate()

        return max((current_date - created_date).days, 0)


    def get_is_aged_90_plus(self, obj):
        stock_age_days = self.get_stock_age_days(obj)

        if stock_age_days is None:
            return False

        return stock_age_days >= 90

    class Meta:
        model = Car

        fields = (
            "id",
            "stock_id",
            "branch",
            "year",
            "make",
            "model",
            "variant",
            "colour",
            "status",
            "asking_price",
            "mileage",
            "vehicle_type",
            "actual_mileage",
            "service_location",
            "chassis_number",
            "purchase_cost",
            "supplier",
            "expenses_total",
            "total_cost",
            "estimated_margin",
            "created_at",
            "stock_age_days",
            "is_aged_90_plus",
            
            "images",
            "vehicle_type",
            "actual_mileage",
            "service_location",
            "purchase_cost",
            "supplier",
            "expenses_total",
            "total_cost",
            "estimated_margin",
        )

class CarDetailSerializer(
    InventoryFinancialFieldsMixin,
    serializers.ModelSerializer,
):
    expenses_total = serializers.SerializerMethodField()
    total_cost = serializers.SerializerMethodField()
    estimated_margin = serializers.SerializerMethodField()

    images = CarImageSerializer(
        many=True,
        read_only=True,
    )

    expenses = CarExpenseSerializer(
        many=True,
        read_only=True,
    )

    expense_summary = serializers.SerializerMethodField()
    stock_age_days = serializers.SerializerMethodField()
    is_aged_90_plus = serializers.SerializerMethodField()

    def get_expense_summary(self, obj):

        from .selectors import InventorySelector

        summary = InventorySelector.get_expense_summary(obj)

        return ExpenseSummarySerializer(summary).data
    
    def get_stock_age_days(self, obj):
        if not obj.created_at:
            return None

        created_date = timezone.localtime(obj.created_at).date()
        current_date = timezone.localdate()

        return max((current_date - created_date).days, 0)


    def get_is_aged_90_plus(self, obj):
        stock_age_days = self.get_stock_age_days(obj)

        if stock_age_days is None:
            return False

        return stock_age_days >= 90
    
    def get_fields(self):
        fields = super().get_fields()

        request = self.context.get("request")

        return remove_sensitive_fields(
            fields,
            request,
        )

    class Meta:
        model = Car

        fields = (
            "id",
            "stock_id",
            "branch",
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
            "stock_age_days",
            "is_aged_90_plus",
            "updated_at",
            "images",
            "expenses",
            "expense_summary",
            "expenses_total",
            "total_cost",
            "estimated_margin",
            "vehicle_type",
            "actual_mileage",
            "service_location",
        )
        
class CarPrintSerializer(serializers.ModelSerializer):
    stock_age_days = serializers.SerializerMethodField()
    is_aged_90_plus = serializers.SerializerMethodField()
    date_added = serializers.DateTimeField(
        source="created_at",
        read_only=True,
    )

    def get_stock_age_days(self, obj):
        if not obj.created_at:
            return None

        created_date = timezone.localtime(
            obj.created_at
        ).date()

        current_date = timezone.localdate()

        return max(
            (current_date - created_date).days,
            0,
        )

    def get_is_aged_90_plus(self, obj):
        stock_age_days = self.get_stock_age_days(obj)

        if stock_age_days is None:
            return False

        return stock_age_days >= 90

    def get_fields(self):
        fields = super().get_fields()

        request = self.context.get("request")
        user = getattr(request, "user", None)

        role = getattr(user, "role", None)

        # Public/customer stock format
        if self.context.get("public_stock") is True:
            allowed_fields = {
                "stock_id",
                "make",
                "model",
                "year",
                "colour",
                "mileage",
                "asking_price",
                "status",
            }

            return {
                field_name: field
                for field_name, field in fields.items()
                if field_name in allowed_fields
            }

        # Master receives the complete permitted print format
        if role == "MASTER":
            return fields

        # Admin and Sales Staff must not receive sensitive fields
        restricted_fields = {
            "purchase_cost",
            "expenses_total",
            "total_cost",
            "estimated_margin",
            "supplier",
            "actual_mileage",
        }

        for field_name in restricted_fields:
            fields.pop(field_name, None)

        return fields

    class Meta:
        model = Car

        fields = (
            "id",
            "stock_id",
            "branch",
            "make",
            "model",
            "variant",
            "year",
            "colour",
            "mileage",
            "asking_price",
            "least_selling_price",
            "status",
            "source",
            "chassis_number",
            "date_added",
            "created_at",
            "stock_age_days",
            "is_aged_90_plus",
            "purchase_cost",
            "supplier",
        )

        read_only_fields = fields

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
            "branch",
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
            "vehicle_type",
            "actual_mileage",
            "service_location",
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
    
    
class SpecialPriceRequestCreateSerializer(
    serializers.Serializer
):
    car_id = serializers.UUIDField()
    requested_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )


class SpecialPriceRequestSerializer(
    serializers.ModelSerializer
):
    car_stock_id = serializers.CharField(
        source="car.stock_id",
        read_only=True,
    )

    vehicle_name = serializers.SerializerMethodField()
    chassis_number = serializers.CharField(
        source="car.chassis_number",
        read_only=True,
    )

    requested_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    used_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SpecialPriceRequest

        fields = (
            "id",
            "car",
            "car_stock_id",
            "vehicle_name",
            "chassis_number",

            "quote",
            "emi_sheet",

            "requested_price",

            "inventory_asked_price",
            "inventory_purchase_cost",
            "inventory_vehicle_expenses",
            "least_selling_price_at_request",

            "requested_by",
            "requested_by_name",

            "status",

            "approved_price",
            "approved_by",
            "approved_by_name",
            "approved_at",

            "expires_at",

            "declined_at",

            "used_at",
            "used_by",
            "used_by_name",

            "decision_note",

            "created_at",
            "updated_at",
        )

        read_only_fields = fields

    def get_vehicle_name(self, obj):
        car = obj.car

        parts = [
            str(car.year) if car.year else "",
            car.make or "",
            car.model or "",
            car.variant or "",
        ]

        return " ".join(
            part.strip()
            for part in parts
            if part and part.strip()
        )

    def get_requested_by_name(self, obj):
        if not obj.requested_by:
            return None

        full_name = (
            f"{obj.requested_by.first_name} "
            f"{obj.requested_by.last_name}"
        ).strip()

        return (
            full_name
            or obj.requested_by.email
        )

    def get_approved_by_name(self, obj):
        if not obj.approved_by:
            return None

        full_name = (
            f"{obj.approved_by.first_name} "
            f"{obj.approved_by.last_name}"
        ).strip()

        return (
            full_name
            or obj.approved_by.email
        )

    def get_used_by_name(self, obj):
        if not obj.used_by:
            return None

        full_name = (
            f"{obj.used_by.first_name} "
            f"{obj.used_by.last_name}"
        ).strip()

        return (
            full_name
            or obj.used_by.email
        )


class SpecialPriceDecisionSerializer(
    serializers.Serializer
):
    action = serializers.ChoiceField(
        choices=("approve", "decline"),
    )

    approved_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
        required=False,
    )

    expires_at = serializers.DateTimeField(
        required=False,
    )

    decision_note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=5000,
    )

class VehicleDocumentSerializer(serializers.ModelSerializer):
    car_id = serializers.UUIDField(
        source="car.id",
        read_only=True,
    )

    document_type_display = serializers.CharField(
        source="get_document_type_display",
        read_only=True,
    )

    uploaded_by_name = serializers.SerializerMethodField()

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = VehicleDocument

        fields = (
            "id",
            "car_id",
            "document_type",
            "document_type_display",
            "file",
            "file_url",
            "original_filename",
            "mime_type",
            "file_size",
            "uploaded_by",
            "uploaded_by_name",
            "uploaded_at",
            "is_archived",
            "archived_by",
            "archived_at",
        )

        read_only_fields = (
            "id",
            "car_id",
            "file_url",
            "original_filename",
            "mime_type",
            "file_size",
            "uploaded_by",
            "uploaded_by_name",
            "uploaded_at",
            "is_archived",
            "archived_by",
            "archived_at",
        )

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return None

        return (
            getattr(obj.uploaded_by, "full_name", None)
            or getattr(obj.uploaded_by, "name", None)
            or getattr(obj.uploaded_by, "email", None)
        )

    def get_file_url(self, obj):
        request = self.context.get("request")

        if not obj.file:
            return None

        url = obj.file.url

        if request:
            return request.build_absolute_uri(url)

        return url

    def validate_file(self, file):
        allowed_types = (
            "application/pdf",
            "image/jpeg",
            "image/png",
        )

        max_size = 10 * 1024 * 1024

        if file.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Document must be PDF, JPG or PNG."
            )

        if file.size > max_size:
            raise serializers.ValidationError(
                "Maximum document size is 10 MB."
            )

        return file

    def validate_document_type(self, value):
        allowed_types = {
            VehicleDocument.DocumentType.POSSESSION,
            VehicleDocument.DocumentType.RTA_PASSING,
            VehicleDocument.DocumentType.INVOICE,
            VehicleDocument.DocumentType.MULKIYA,
            VehicleDocument.DocumentType.RTA_SUBMISSION_FORM,
            VehicleDocument.DocumentType.OTHER,
        }

        if value not in allowed_types:
            raise serializers.ValidationError(
                "Only POSSESSION, RTA_PASSING, INVOICE, MULKIYA and OTHER documents are allowed."
            )

        return value
    
