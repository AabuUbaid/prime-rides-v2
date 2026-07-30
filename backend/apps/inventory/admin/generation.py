from django.contrib import admin

from apps.inventory.models import Generation

from .lookup import LookupAdmin


@admin.register(Generation)
class GenerationAdmin(LookupAdmin):

    list_display = (
        "vehicle_model",
        "name",
        "display_order",
        "code",
        "production_start_year",
        "production_end_year",
        "is_active",
    )

    list_display_links = (
        "name",
    )

    search_fields = (
        "name",
        "code",
        "vehicle_model__name",
        "vehicle_model__manufacturer__name",
    )

    autocomplete_fields = (
        "vehicle_model",
    )

    list_filter = (
        "vehicle_model__manufacturer",
        "is_active",
    )

    list_select_related = (
        "vehicle_model",
        "vehicle_model__manufacturer",
    )