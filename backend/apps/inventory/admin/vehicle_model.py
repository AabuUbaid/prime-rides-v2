from django.contrib import admin

from apps.inventory.models import VehicleModel

from .lookup import LookupAdmin


@admin.register(VehicleModel)
class VehicleModelAdmin(LookupAdmin):

    list_display = (
        "manufacturer",
        "name",
        "display_order",
        "code",
        "is_active",
    )

    list_display_links = (
        "name",
    )

    search_fields = (
        "name",
        "code",
        "manufacturer__name",
    )

    list_filter = (
        "manufacturer",
        "is_active",
    )

    autocomplete_fields = (
        "manufacturer",
    )

    list_select_related = (
        "manufacturer",
    )