from .base import LookupModel


class FuelType(LookupModel):
    class Meta:
        db_table = "inventory_fuel_types"


class Transmission(LookupModel):
    class Meta:
        db_table = "inventory_transmissions"


class DriveType(LookupModel):
    class Meta:
        db_table = "inventory_drive_types"


class BodyType(LookupModel):
    class Meta:
        db_table = "inventory_body_types"


class Color(LookupModel):
    class Meta:
        db_table = "inventory_colors"


class InteriorColor(LookupModel):
    class Meta:
        db_table = "inventory_interior_colors"


class EngineType(LookupModel):
    class Meta:
        db_table = "inventory_engine_types"


class VehicleStatus(LookupModel):
    class Meta:
        db_table = "inventory_vehicle_statuses"