from django.contrib import admin

from apps.inventory.models import Vehicle
from apps.inventory.services.vehicle import (
    feature_vehicle,
    publish_vehicle,
    unfeature_vehicle,
    unpublish_vehicle,
)

from .base import BaseAdmin


@admin.register(Vehicle)
class VehicleAdmin(BaseAdmin):
    """
    Admin configuration for Vehicle.
    """

    list_display = (
        "stock_number",
        "vehicle_model",
        "generation",
        "variant",
        "manufacturing_year",
        "selling_price",
        "status",
        "published",
        "featured",
        "created_at",
    )

    list_display_links = (
        "stock_number",
    )

    ordering = (
        "-created_at",
    )

    list_per_page = 25

    search_fields = (
        "stock_number",
        "vin",
        "engine_number",
        "registration_number",
        "vehicle_model__name",
        "vehicle_model__manufacturer__name",
        "generation__code",
        "variant__name",
    )

    list_filter = (
        "published",
        "featured",
        "status",
        "fuel_type",
        "transmission",
        "drive_type",
        "body_type",
        "engine_type",
        "manufacturing_year",
        "model_year",
        "vehicle_model__manufacturer",
    )

    list_select_related = (
        "vehicle_model",
        "vehicle_model__manufacturer",
        "generation",
        "variant",
        "fuel_type",
        "transmission",
        "drive_type",
        "body_type",
        "engine_type",
        "exterior_color",
        "interior_color",
        "status",
        "created_by",
        "updated_by",
    )

    autocomplete_fields = (
        "vehicle_model",
        "generation",
        "variant",
        "fuel_type",
        "transmission",
        "drive_type",
        "body_type",
        "engine_type",
        "exterior_color",
        "interior_color",
        "status",
    )

    readonly_fields = (
        "stock_number",
        "slug",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
    )

    fieldsets = (
        (
            "Identity",
            {
                "fields": (
                    "stock_number",
                    "vin",
                    "engine_number",
                    "registration_number",
                    "slug",
                )
            },
        ),
        (
            "Vehicle Classification",
            {
                "fields": (
                    "vehicle_model",
                    "generation",
                    "variant",
                    "status",
                )
            },
        ),
        (
            "Specifications",
            {
                "fields": (
                    "fuel_type",
                    "transmission",
                    "drive_type",
                    "body_type",
                    "engine_type",
                    "exterior_color",
                    "interior_color",
                )
            },
        ),
        (
            "Production",
            {
                "fields": (
                    "manufacturing_year",
                    "model_year",
                )
            },
        ),
        (
            "Engine",
            {
                "fields": (
                    "engine_capacity_cc",
                    "horsepower",
                    "torque_nm",
                )
            },
        ),
        (
            "Cabin",
            {
                "fields": (
                    "doors",
                    "seats",
                )
            },
        ),
        (
            "Condition",
            {
                "fields": (
                    "mileage",
                    "owner_count",
                    "service_history",
                    "accident_history",
                    "warranty_available",
                    "imported",
                )
            },
        ),
        (
            "Commercial",
            {
                "fields": (
                    "purchase_price",
                    "selling_price",
                    "minimum_selling_price",
                    "purchase_date",
                )
            },
        ),
        (
            "Marketplace",
            {
                "fields": (
                    "published",
                    "featured",
                    "description",
                )
            },
        ),
        (
            "Audit",
            {
                "classes": ("collapse",),
                "fields": (
                    "created_by",
                    "created_at",
                    "updated_by",
                    "updated_at",
                ),
            },
        ),
    )

    actions = (
        "publish_selected",
        "unpublish_selected",
        "feature_selected",
        "unfeature_selected",
    )

    def save_model(self, request, obj, form, change):
        """
        Automatically populate audit fields.
        """

        if not change and not obj.created_by:
            obj.created_by = request.user

        obj.updated_by = request.user

        super().save_model(request, obj, form, change)

    @admin.action(description="Publish selected vehicles")
    def publish_selected(self, request, queryset):
        for vehicle in queryset:
            publish_vehicle(vehicle)

    @admin.action(description="Unpublish selected vehicles")
    def unpublish_selected(self, request, queryset):
        for vehicle in queryset:
            unpublish_vehicle(vehicle)

    @admin.action(description="Mark selected vehicles as Featured")
    def feature_selected(self, request, queryset):
        for vehicle in queryset:
            feature_vehicle(vehicle)

    @admin.action(description="Remove Featured status")
    def unfeature_selected(self, request, queryset):
        for vehicle in queryset:
            unfeature_vehicle(vehicle)