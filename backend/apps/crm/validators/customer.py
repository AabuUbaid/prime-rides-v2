from django.core.exceptions import ValidationError


def validate_customer_identity(
    *,
    customer_type: str,
    first_name: str,
    company_name: str,
    email: str,
    phone_number: str,
) -> None:
    if not email and not phone_number:
        raise ValidationError(
            {"phone_number": "Provide at least one contact method."}
        )

    if customer_type == "COMPANY" and not company_name:
        raise ValidationError(
            {"company_name": "Company name is required for company customers."}
        )

    if customer_type == "INDIVIDUAL" and not first_name:
        raise ValidationError(
            {"first_name": "First name is required for individual customers."}
        )
