from django.contrib import admin

from apps.inventory.models import Manufacturer

from .lookup import LookupAdmin


@admin.register(Manufacturer)
class ManufacturerAdmin(LookupAdmin):
    pass