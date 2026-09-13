from rest_framework import serializers

from .models import Progression


class ProgressionSerializer(serializers.ModelSerializer):
    quote_number = serializers.CharField(
        source="quote.quote_number",
        read_only=True,
    )

    payment_method = serializers.CharField(
        source="quote.payment_method",
        read_only=True,
    )

    customer_name = serializers.CharField(
        source="quote.customer_name",
        read_only=True,
    )

    customer_mobile = serializers.CharField(
        source="quote.customer_mobile",
        read_only=True,
    )

    vehicle_stock_id = serializers.SerializerMethodField()
    vehicle_make = serializers.SerializerMethodField()
    vehicle_model = serializers.SerializerMethodField()
    vehicle_year = serializers.SerializerMethodField()
    chassis_number = serializers.SerializerMethodField()

    seller_name = serializers.SerializerMethodField()
    seller_staff_id = serializers.SerializerMethodField()

    bank_name = serializers.SerializerMethodField()
    bank_loan_status = serializers.SerializerMethodField()

    selling_price = serializers.SerializerMethodField()
    evaluation_price = serializers.SerializerMethodField()
    submitted_date = serializers.SerializerMethodField()

    class Meta:
        model = Progression
        fields = (
            "id",
            "quote",
            "quote_number",
            "payment_method",
            "source_type",
            "status",
            "current_stage",
            "registration_emirate",
            "remark",
            "customer_name",
            "customer_mobile",
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_year",
            "chassis_number",
            "seller_name",
            "seller_staff_id",
            "bank_name",
            "bank_loan_status",
            "selling_price",
            "evaluation_price",
            "submitted_date",
            "created_at",
            "updated_at",
            "completed_at",
        )
        read_only_fields = (
            "id",
            "quote",
            "quote_number",
            "payment_method",
            "source_type",
            "status",
            "current_stage",
            "customer_name",
            "customer_mobile",
            "vehicle_stock_id",
            "vehicle_make",
            "vehicle_model",
            "vehicle_year",
            "chassis_number",
            "seller_name",
            "seller_staff_id",
            "bank_name",
            "bank_loan_status",
            "selling_price",
            "evaluation_price",
            "submitted_date",
            "created_at",
            "updated_at",
            "completed_at",
        )

    def get_vehicle_stock_id(self, obj):
        if obj.bank_loan is not None:
            return obj.bank_loan.vehicle_stock_id

        if obj.cash_deal is not None:
            return obj.cash_deal.vehicle_stock_id

        if obj.quote.car is not None:
            return obj.quote.car.stock_id

        return obj.quote.vehicle_stock_id or None


    def get_vehicle_make(self, obj):
        if obj.bank_loan is not None:
            return obj.bank_loan.vehicle_make

        if obj.cash_deal is not None:
            return obj.cash_deal.vehicle_make

        if obj.quote.car is not None:
            return obj.quote.car.make

        return obj.quote.vehicle_make or None


    def get_vehicle_model(self, obj):
        if obj.bank_loan is not None:
            return obj.bank_loan.vehicle_model

        if obj.cash_deal is not None:
            return obj.cash_deal.vehicle_model

        if obj.quote.car is not None:
            return obj.quote.car.model

        return obj.quote.vehicle_model or None


    def get_vehicle_year(self, obj):
        if obj.bank_loan is not None:
            return obj.bank_loan.vehicle_year

        if obj.cash_deal is not None:
            return obj.cash_deal.vehicle_year

        if obj.quote.car is not None:
            return obj.quote.car.year

        return obj.quote.vehicle_year


    def get_chassis_number(self, obj):
        if obj.bank_loan is not None:
            return obj.bank_loan.vehicle_chassis_number

        if obj.cash_deal is not None:
            return obj.cash_deal.vehicle_chassis_number

        if obj.quote.car is not None:
            return obj.quote.car.chassis_number

        return obj.quote.vehicle_chassis_number or None


    def get_seller_name(self, obj):
        salesperson = None

        if obj.bank_loan is not None:
            salesperson = obj.bank_loan.agent

        elif obj.cash_deal is not None:
            salesperson = obj.cash_deal.agent

        elif obj.quote is not None:
            salesperson = obj.quote.salesperson

        if salesperson is None:
            return None

        staff = getattr(
            salesperson,
            "staff_profile",
            None,
        )

        if staff is not None:
            return staff.name

        full_name = (
            f"{salesperson.first_name} "
            f"{salesperson.last_name}"
        ).strip()

        return (
            full_name
            or getattr(salesperson, "email", None)
            or getattr(salesperson, "username", None)
        )


    def get_seller_staff_id(self, obj):
        salesperson = None

        if obj.bank_loan is not None:
            salesperson = obj.bank_loan.agent

        elif obj.cash_deal is not None:
            salesperson = obj.cash_deal.agent

        elif obj.quote is not None:
            salesperson = obj.quote.salesperson

        if salesperson is None:
            return None

        staff = getattr(
            salesperson,
            "staff_profile",
            None,
        )

        return staff.id if staff else None


    def get_bank_name(self, obj):
        if obj.bank_loan is not None:
            return obj.bank_loan.bank_name

        return None


    def get_bank_loan_status(self, obj):
        if obj.bank_loan is not None:
            return obj.bank_loan.status

        return None


    def get_selling_price(self, obj):
        if obj.bank_loan is not None:
            return obj.bank_loan.selling_price

        if obj.cash_deal is not None:
            return obj.cash_deal.selling_price

        return obj.quote.price


    def get_evaluation_price(self, obj):
        if obj.bank_loan is not None:
            return obj.bank_loan.evaluation

        if obj.cash_deal is not None:
            return obj.cash_deal.evaluation

        if obj.quote.emi_sheet is not None:
            return obj.quote.emi_sheet.car_value_evaluation

        return None


    def get_submitted_date(self, obj):
        if obj.bank_loan is not None:
            return (
                obj.bank_loan.application_date
                or obj.bank_loan.created_at.date()
            )

        if obj.cash_deal is not None:
            return obj.cash_deal.created_at.date()

        return obj.quote.created_at.date()


class ProgressionUpdateSerializer(
    serializers.ModelSerializer,
):
    class Meta:
        model = Progression
        fields = (
            "registration_emirate",
            "remark",
        )
        
class ProgressionAdvanceSerializer(serializers.Serializer):
    override_balance_gate = serializers.BooleanField(
        required=False,
        default=False,
    )

    reason = serializers.CharField(
        required=False,
        allow_blank=False,
        max_length=2000,
    )

    def validate(self, attrs):
        override_balance_gate = attrs.get(
            "override_balance_gate",
            False,
        )

        reason = attrs.get("reason")

        if override_balance_gate:
            if reason is None or not reason.strip():
                raise serializers.ValidationError(
                    {
                        "reason": (
                            "A reason is required when "
                            "overriding the Balance Sheet gate."
                        )
                    }
                )

            attrs["reason"] = reason.strip()

        elif reason is not None:
            raise serializers.ValidationError(
                {
                    "reason": (
                        "Reason can only be supplied when "
                        "override_balance_gate is true."
                    )
                }
            )

        return attrs