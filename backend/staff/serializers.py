from rest_framework import serializers

from accounts.models import User

from .models import Staff


class StaffUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "is_active",
        )
        read_only_fields = fields


class StaffSerializer(serializers.ModelSerializer):
    user = StaffUserSerializer(
        read_only=True,
    )

    class Meta:
        model = Staff
        fields = (
            "id",
            "user",
            "name",
            "phone",
            "join_date",
            "job_role",
            "base_salary",
            "visa_expiry",
            "leave_balance",
            "notes",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "created_at",
            "updated_at",
        )

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Staff name is required."
            )

        return value

    def validate_phone(self, value):
        return value.strip()

    def validate_leave_balance(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Leave balance cannot be negative."
            )

        return value

    def validate_base_salary(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Base salary cannot be negative."
            )

        return value


class StaffCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = (
            "name",
            "phone",
            "join_date",
            "job_role",
            "base_salary",
            "visa_expiry",
            "leave_balance",
            "notes",
            "status",
        )

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Staff name is required."
            )

        return value


class StaffUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = (
            "name",
            "phone",
            "join_date",
            "job_role",
            "base_salary",
            "visa_expiry",
            "leave_balance",
            "notes",
            "status",
        )
        extra_kwargs = {
            "name": {
                "required": False,
            },
        }

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Staff name is required."
            )

        return value

    def validate_base_salary(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Base salary cannot be negative."
            )

        return value

    def validate_leave_balance(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Leave balance cannot be negative."
            )

        return value


class UserAccessCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )
    first_name = serializers.CharField(
        max_length=100,
    )
    last_name = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )
    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
    )
    role = serializers.ChoiceField(
        choices=User.Roles.choices,
    )
    staff_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )
    is_active = serializers.BooleanField(
        default=True,
    )

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value

    def validate_first_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "First name is required."
            )

        return value


class UserAccessUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=False,
    )
    first_name = serializers.CharField(
        max_length=100,
        required=False,
    )
    last_name = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )
    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
    )
    role = serializers.ChoiceField(
        choices=User.Roles.choices,
        required=False,
    )
    staff_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )
    is_active = serializers.BooleanField(
        required=False,
    )

    def validate_email(self, value):
        value = value.strip().lower()

        instance = self.context.get("user")

        queryset = User.objects.filter(
            email__iexact=value,
        )

        if instance is not None:
            queryset = queryset.exclude(
                pk=instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value

    def validate_first_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "First name is required."
            )

        return value


class UserAccessSerializer(serializers.ModelSerializer):
    staff_id = serializers.SerializerMethodField()
    staff_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "is_active",
            "staff_id",
            "staff_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_staff_id(self, obj):
        staff = getattr(
            obj,
            "staff_profile",
            None,
        )

        return staff.id if staff else None

    def get_staff_name(self, obj):
        staff = getattr(
            obj,
            "staff_profile",
            None,
        )

        return staff.name if staff else None