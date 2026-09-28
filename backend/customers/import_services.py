import csv
import io

from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import Customer
from .services import (
    normalize_email,
    normalize_phone_number,
    validate_customer_name,
)


REQUIRED_COLUMNS = {
    "customer_name",
    "phone_number",
}


def _normalize_csv_value(value):
    if value is None:
        return ""
    return str(value).strip()


def _validate_csv_columns(fieldnames):
    normalized_columns = {
        _normalize_csv_value(column)
        for column in (fieldnames or [])
        if column
    }

    missing_columns = sorted(
        REQUIRED_COLUMNS - normalized_columns
    )

    if missing_columns:
        raise ValidationError(
            {
                "file": (
                    "Missing required CSV columns: "
                    + ", ".join(missing_columns)
                )
            }
        )


def _validate_email(email):
    email = normalize_email(email)

    if not email:
        return email

    if (
        "@" not in email
        or email.startswith("@")
        or email.endswith("@")
    ):
        raise ValidationError(
            {
                "email": "Enter a valid email address."
            }
        )

    return email


def import_customers_from_csv(
    *,
    uploaded_file,
    agent=None,
):
    try:
        raw_content = uploaded_file.read()

        if isinstance(raw_content, bytes):
            raw_content = raw_content.decode(
                "utf-8-sig"
            )

        csv_file = io.StringIO(
            raw_content,
            newline="",
        )

        reader = csv.DictReader(csv_file)

    except UnicodeDecodeError:
        raise ValidationError(
            {
                "file": (
                    "CSV file must use UTF-8 encoding."
                )
            }
        )

    _validate_csv_columns(reader.fieldnames)

    imported_count = 0
    failed_count = 0
    duplicate_count = 0

    errors = []
    duplicates = []

    for row_number, row in enumerate(
        reader,
        start=2,
    ):
        if not any(
            _normalize_csv_value(value)
            for value in row.values()
        ):
            continue
        try:
            customer_name = _normalize_csv_value(
                row.get("customer_name")
            )
            phone_number = _normalize_csv_value(
                row.get("phone_number")
            )
            email = _normalize_csv_value(
                row.get("email")
            )

            customer_name = validate_customer_name(
                customer_name
            )

            phone_number = normalize_phone_number(
                phone_number
            )

            email = _validate_email(email)

            existing_customer = (
                Customer.objects
                .filter(
                    phone_number=phone_number,
                )
                .first()
            )

            if existing_customer is not None:
                duplicate_count += 1

                duplicates.append(
                    {
                        "row": row_number,
                        "phone_number": phone_number,
                        "customer_id": existing_customer.pk,
                    }
                )

                continue

            with transaction.atomic():
                Customer.objects.create(
                    customer_name=customer_name,
                    phone_number=phone_number,
                    email=email,
                    agent=agent,
                )

            imported_count += 1

        except ValidationError as exc:
            failed_count += 1

            detail = exc.detail

            errors.append(
                {
                    "row": row_number,
                    "errors": detail,
                }
            )

        except Exception as exc:
            failed_count += 1

            errors.append(
                {
                    "row": row_number,
                    "errors": {
                        "non_field_errors": [
                            str(exc)
                        ]
                    },
                }
            )

    return {
        "imported_count": imported_count,
        "failed_count": failed_count,
        "duplicate_count": duplicate_count,
        "errors": errors,
        "duplicates": duplicates,
    }