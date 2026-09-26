
from django.db import transaction
from django.utils import timezone

from .models import RTARecord


def _get_value(instance, *field_names, default=None):
    """
    Return the first available non-empty field value.
    """
    if not instance:
        return default

    for field_name in field_names:
        value = getattr(instance, field_name, None)

        if value not in (None, ""):
            return value

    return default


def _get_display_name(instance):
    if not instance:
        return None

    return _get_value(
        instance,
        "name",
        "full_name",
        "legal_entity_name",
        "company_name",
        "username",
        default=str(instance),
    )


def build_rta_snapshot(
    *,
    quote,
    car=None,
    customer=None,
    company=None,
    branch=None,
    supplier_name="",
    supplier_mobile="",
    supplier_address="",
    supplier_trade_license_number="",
):
    car = car or _get_value(quote, "car", "vehicle")
    customer = customer or _get_value(quote, "customer")

    return {
        "quote": {
            "id": str(getattr(quote, "id", "")),
            "quote_number": _get_value(
                quote,
                "quote_number",
                "number",
                "reference_number",
            ),
            "payment_method": _get_value(
                quote,
                "payment_method",
            ),
            "selling_price": str(
                _get_value(
                    quote,
                    "selling_price",
                    "total_amount",
                    "grand_total",
                    default="0",
                )
            ),
        },

        "customer": {
            "id": str(getattr(customer, "id", ""))
            if customer
            else None,
            "name": _get_display_name(customer),
            "mobile": _get_value(
                customer,
                "mobile",
                "phone",
                "phone_number",
            )
            if customer
            else None,
        },

        "supplier": {
            "name": supplier_name or "",
            "mobile": supplier_mobile or "",
            "address": supplier_address or "",
            "trade_license_number": (
                supplier_trade_license_number or ""
            ),
        },

        "vehicle": {
            "id": str(getattr(car, "id", ""))
            if car
            else None,
            "stock_id": _get_value(
                car,
                "stock_id",
                "vehicle_stock_id",
            )
            if car
            else None,
            "make": _get_value(
                car,
                "make",
                "brand",
                "manufacturer",
            )
            if car
            else None,
            "model": _get_value(car, "model")
            if car
            else None,
            "variant": _get_value(car, "variant")
            if car
            else None,
            "type": _get_value(
                car,
                "vehicle_type",
                "type",
            )
            if car
            else None,
            "year": _get_value(
                car,
                "year",
                "model_year",
            )
            if car
            else None,
            "colour": _get_value(
                car,
                "colour",
                "color",
                "vehicle_colour",
            )
            if car
            else None,
            "country_of_manufacture": _get_value(
                car,
                "country_of_manufacture",
                "manufacturing_country",
            )
            if car
            else None,
            "chassis_number": _get_value(
                car,
                "chassis_number",
                "vin",
            )
            if car
            else None,
            "engine_number": _get_value(
                car,
                "engine_number",
            )
            if car
            else None,
        },

        "company": {
            "id": str(getattr(company, "id", ""))
            if company
            else None,
            "legal_name": _get_value(
                company,
                "legal_entity_name",
                "company_name",
                "name",
            )
            if company
            else None,
            "trade_license_number": _get_value(
                company,
                "trade_license_number",
                "license_number",
            )
            if company
            else None,
            "address": _get_value(
                company,
                "showroom_address",
                "address",
            )
            if company
            else None,
        },

        "branch": {
            "id": str(getattr(branch, "id", ""))
            if branch
            else None,
            "name": _get_value(branch, "name")
            if branch
            else None,
            "address": _get_value(branch, "address")
            if branch
            else None,
            "contact_mobile": _get_value(
                branch,
                "contact_mobile",
                "mobile",
                "phone",
            )
            if branch
            else None,
        },

        "generated_at": timezone.now().isoformat(),
    }


@transaction.atomic
def create_rta_record(
    *,
    record_type,
    quote=None,
    user=None,
    car=None,
    customer=None,
    company=None,
    branch=None,
    **extra_fields,
):
    """
    Create an RTA record and populate its snapshot fields.
    """

    car = car or _get_value(quote, "car", "vehicle")
    customer = customer or _get_value(quote, "customer")

    supplier_name = extra_fields.pop("supplier_name", "")
    supplier_mobile = extra_fields.pop("supplier_mobile", "")
    supplier_address = extra_fields.pop("supplier_address", "")
    supplier_trade_license_number = extra_fields.pop(
        "supplier_trade_license_number",
        "",
    )

    snapshot_data = build_rta_snapshot(
        quote=quote,
        car=car,
        customer=customer,
        company=company,
        branch=branch,
        supplier_name=supplier_name,
        supplier_mobile=supplier_mobile,
        supplier_address=supplier_address,
        supplier_trade_license_number=(
            supplier_trade_license_number
        ),
    )

    quote_data = snapshot_data["quote"]
    customer_data = snapshot_data["customer"]
    supplier_data = snapshot_data["supplier"]
    vehicle_data = snapshot_data["vehicle"]
    company_data = snapshot_data["company"]

    company_name = company_data["legal_name"] or ""

    # Company is the first party for both record types.
    first_party_name = company_name
    first_party_role = "Company" if company_name else ""

    # Sale: Company -> Customer
    # Purchase: Company -> Supplier
    if record_type == RTARecord.RecordType.PURCHASE:
        second_party_name = supplier_data["name"]
        second_party_role = (
            "Supplier"
            if second_party_name
            else ""
        )
        second_party_mobile = supplier_data["mobile"]

    else:
        second_party_name = customer_data["name"] or ""
        second_party_role = (
            "Customer"
            if second_party_name
            else ""
        )
        second_party_mobile = customer_data["mobile"] or ""

    populated_fields = {
        "first_party_name": first_party_name,
        "first_party_role": first_party_role,
        "second_party_name": second_party_name,
        "second_party_role": second_party_role,
        "second_party_mobile": second_party_mobile,

        "company_legal_name": company_data["legal_name"] or "",
        "trade_license_number": (
            company_data["trade_license_number"] or ""
        ),
        "company_address": company_data["address"] or "",

        "vehicle_stock_id": vehicle_data["stock_id"] or "",
        "vehicle_make": vehicle_data["make"] or "",
        "vehicle_model": vehicle_data["model"] or "",
        "vehicle_variant": vehicle_data["variant"] or "",
        "vehicle_type": vehicle_data["type"] or "",
        "vehicle_year": vehicle_data["year"],
        "vehicle_colour": vehicle_data["colour"] or "",
        "vehicle_country_of_manufacture": (
            vehicle_data["country_of_manufacture"] or ""
        ),
        "vehicle_chassis_number": (
            vehicle_data["chassis_number"] or ""
        ),
        "vehicle_engine_number": (
            vehicle_data["engine_number"] or ""
        ),

        "snapshot_data": snapshot_data,

        "rta_date": extra_fields.pop(
            "rta_date",
            timezone.localdate(),
        ),
    }

    # Prevent duplicate keyword arguments.
    extra_fields.pop("record_type", None)
    extra_fields.pop("quote", None)
    extra_fields.pop("car", None)
    extra_fields.pop("customer", None)
    extra_fields.pop("company", None)
    extra_fields.pop("branch", None)
    extra_fields.pop("snapshot_data", None)

    record = RTARecord.objects.create(
        record_type=record_type,
        quote=quote,
        car=car,
        customer=customer,
        company=company,
        branch=branch,
        supplier_name=supplier_name,
        supplier_mobile=supplier_mobile,
        supplier_address=supplier_address,
        supplier_trade_license_number=(
            supplier_trade_license_number
        ),
        **populated_fields,
        **extra_fields,
    )

    return record