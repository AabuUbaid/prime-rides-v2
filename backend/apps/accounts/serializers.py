from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "is_active",
            "is_staff",
            "role",
            "permissions",
        )

    def get_role(self, obj):
        if obj.role:
            return obj.role.name
        return None

    def get_permissions(self, obj):
        return obj.permission_codes


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)