from django.contrib import admin

from apps.inventory.models import VehicleDocument, VehicleImage

from .base import BaseAdmin


@admin.register(VehicleImage)
class VehicleImageAdmin(BaseAdmin):
    list_display = (
        "vehicle",
        "alt_text",
        "display_order",
        "is_primary",
        "is_active",
        "created_at",
    )
    list_filter = ("is_primary", "is_active")
    search_fields = ("vehicle__stock_number", "alt_text")
    autocomplete_fields = ("vehicle",)
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")


@admin.register(VehicleDocument)
class VehicleDocumentAdmin(BaseAdmin):
    list_display = (
        "vehicle",
        "title",
        "document_type",
        "expires_on",
        "is_active",
        "created_at",
    )
    list_filter = ("document_type", "is_active")
    search_fields = ("vehicle__stock_number", "title")
    autocomplete_fields = ("vehicle",)
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")
