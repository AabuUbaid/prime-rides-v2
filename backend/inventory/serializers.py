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
            "supplier",
            "highlight_public",
            "chassis_number",
            "engine_number",
            "possession_certificate",
            "images",
            "expenses",
            
        )

        extra_kwargs = {
            # Required for vehicle creation
            "make": {"required": True},
            "model": {"required": True},
            "variant": {"required": True},
            "colour": {"required": True},
            "year": {"required": True},
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
    
    remove_certificate = serializers.BooleanField(
        required=False,
        write_only=True,
    )

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

