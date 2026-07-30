from rest_framework import serializers


class BaseModelSerializer(serializers.ModelSerializer):
    """
    Base serializer shared across the inventory app.
    """

    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        abstract = True