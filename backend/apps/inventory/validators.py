from django.core.exceptions import ValidationError
from datetime import date

def validate_vehicle_hierarchy(vehicle_model, generation, variant):
    """
    Validate that:
    VehicleModel -> Generation -> Variant
    belongs to the same hierarchy.
    """

    if generation.vehicle_model_id != vehicle_model.id:
        raise ValidationError(
            {
                "generation": (
                    "The selected generation does not belong "
                    "to the selected vehicle model."
                )
            }
        )

    if variant.generation_id != generation.id:
        raise ValidationError(
            {
                "variant": (
                    "The selected variant does not belong "
                    "to the selected generation."
                )
            }
        )
def validate_vin(vin):
    """
    VIN must be exactly 17 characters.
    """

    vin = vin.strip().upper()

    if len(vin) != 17:
        raise ValidationError(
            {
                "vin": "VIN must contain exactly 17 characters."
            }
        )

    return vin




def validate_model_year(manufacturing_year, model_year):
    """
    Model year cannot be older than manufacturing year.
    """

    current_year = date.today().year + 1

    if manufacturing_year > current_year:
        raise ValidationError(
            {
                "manufacturing_year": (
                    "Manufacturing year is invalid."
                )
            }
        )

    if model_year < manufacturing_year:
        raise ValidationError(
            {
                "model_year": (
                    "Model year cannot be earlier than "
                    "manufacturing year."
                )
            }
        )

def validate_pricing(
    purchase_price,
    selling_price,
    minimum_selling_price,
):
    """
    Validate vehicle pricing.
    """

    if purchase_price < 0:
        raise ValidationError(
            {
                "purchase_price": (
                    "Purchase price cannot be negative."
                )
            }
        )

    if selling_price <= 0:
        raise ValidationError(
            {
                "selling_price": (
                    "Selling price must be greater than zero."
                )
            }
        )

    if minimum_selling_price > selling_price:
        raise ValidationError(
            {
                "minimum_selling_price": (
                    "Minimum selling price cannot exceed "
                    "selling price."
                )
            }
        )