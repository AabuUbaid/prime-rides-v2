from django.contrib import admin

from apps.inventory.models import Variant

from .lookup import LookupAdmin


@admin.register(Variant)
class VariantAdmin(LookupAdmin):

    list_display = (
        "generation",
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
        "generation__code",
        "generation__vehicle_model__name",
    )

    autocomplete_fields = (
        "generation",
    )

    list_filter = (
        "generation__vehicle_model",
        "is_active",
    )

    list_select_related = (
        "generation",
        "generation__vehicle_model",
    )