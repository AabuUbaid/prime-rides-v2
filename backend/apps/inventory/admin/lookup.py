from django.contrib import admin

from apps.inventory.models import (
    FuelType,
    Transmission,
    DriveType,
    BodyType,
    Color,
    InteriorColor,
    EngineType,
    VehicleStatus,
)


class LookupAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "display_order",
        "code",
        "is_active",
    )

    list_display_links = (
        "name",
    )

    list_editable = (
        "display_order",
        "is_active",
    )

    search_fields = (
        "code",
        "name",
    )

    list_filter = (
        "is_active",
    )

    ordering = (
        "display_order",
        "name",
    )

    list_per_page = 50


admin.site.register(FuelType, LookupAdmin)
admin.site.register(Transmission, LookupAdmin)
admin.site.register(DriveType, LookupAdmin)
admin.site.register(BodyType, LookupAdmin)
admin.site.register(Color, LookupAdmin)
admin.site.register(InteriorColor, LookupAdmin)
admin.site.register(EngineType, LookupAdmin)
admin.site.register(VehicleStatus, LookupAdmin)