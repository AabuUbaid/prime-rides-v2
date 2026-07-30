from rest_framework import serializers

from apps.inventory.models import VehicleStatus


class VehicleBulkImportSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, file):
        if not file.name.lower().endswith(".csv"):
            raise serializers.ValidationError("Only CSV files are supported.")
        return file


class VehicleStatusChangeSerializer(serializers.Serializer):
    status = serializers.PrimaryKeyRelatedField(
        queryset=VehicleStatus.objects.active(),
    )
