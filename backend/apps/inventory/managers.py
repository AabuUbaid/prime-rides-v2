from django.db import models

from apps.common.constants import VehicleStatusCodes


class VehicleQuerySet(models.QuerySet):
    """
    Custom QuerySet for Vehicle.
    Provides reusable, chainable query methods.
    """

    def active(self):
        return self.filter(is_active=True)

    def inactive(self):
        return self.filter(is_active=False)

    def available(self):
        return self.active().filter(
            status__code=VehicleStatusCodes.AVAILABLE
        )

    def sold(self):
        return self.active().filter(
            status__code=VehicleStatusCodes.SOLD
        )

    def reserved(self):
        return self.active().filter(
            status__code=VehicleStatusCodes.RESERVED
        )

    def published(self):
        return self.active().filter(
            published=True
        )

    def unpublished(self):
        return self.active().filter(
            published=False
        )

    def featured(self):
        return self.active().filter(
            featured=True
        )

    def by_status(self, status):
        return self.filter(status=status)

    def by_model(self, vehicle_model):
        return self.filter(vehicle_model=vehicle_model)

    def by_generation(self, generation):
        return self.filter(generation=generation)

    def by_variant(self, variant):
        return self.filter(variant=variant)

    def by_manufacturing_year(self, year):
        return self.filter(manufacturing_year=year)

    def by_model_year(self, year):
        return self.filter(model_year=year)

    def by_fuel_type(self, fuel_type):
        return self.filter(fuel_type=fuel_type)

    def by_transmission(self, transmission):
        return self.filter(transmission=transmission)

    def by_body_type(self, body_type):
        return self.filter(body_type=body_type)

    def search(self, query):
        return self.filter(
            models.Q(stock_number__icontains=query)
            | models.Q(vin__icontains=query)
            | models.Q(engine_number__icontains=query)
            | models.Q(registration_number__icontains=query)
            | models.Q(vehicle_model__name__icontains=query)
            | models.Q(generation__name__icontains=query)
            | models.Q(variant__name__icontains=query)
        )


class VehicleManager(models.Manager.from_queryset(VehicleQuerySet)):
    """
    Custom manager for Vehicle.
    """
    pass