class InventoryError(Exception):
    pass


class VehicleAlreadyPublishedError(InventoryError):
    pass


class VehicleAlreadySoldError(InventoryError):
    pass