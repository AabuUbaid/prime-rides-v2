from rest_framework import serializers

from apps.inventory.models import VehicleDocument, VehicleImage

from .base import BaseModelSerializer


class VehicleImageSerializer(BaseModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = VehicleImage
        fields = (
            "id",
            "image",
            "image_url",
            "alt_text",
            "display_order",
            "is_primary",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class VehicleImageUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()
    alt_text = serializers.CharField(max_length=150, required=False, allow_blank=True)
    display_order = serializers.IntegerField(required=False, min_value=0)
    is_primary = serializers.BooleanField(required=False, default=False)


class VehicleDocumentSerializer(BaseModelSerializer):
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = VehicleDocument
        fields = (
            "id",
            "document",
            "document_url",
            "document_type",
            "title",
            "expires_on",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_document_url(self, obj):
        request = self.context.get("request")
        if not obj.document:
            return None
        url = obj.document.url
        return request.build_absolute_uri(url) if request else url


class VehicleDocumentUploadSerializer(serializers.Serializer):
    document = serializers.FileField()
    document_type = serializers.ChoiceField(
        choices=VehicleDocument._meta.get_field("document_type").choices,
    )
    title = serializers.CharField(max_length=150)
    expires_on = serializers.DateField(required=False, allow_null=True)
