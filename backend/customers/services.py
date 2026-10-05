from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import Customer, CustomerDocument


def normalize_phone_number(
    phone_number,
):
    phone_number = (
        phone_number or ""
    ).strip()

    if not phone_number:
        raise ValidationError(
            {
                "phone_number": (
                    "Phone number is required."
                )
            }
        )

    return (
        phone_number
        .replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )


def validate_customer_name(
    customer_name,
):
    customer_name = (
        customer_name or ""
    ).strip()

    if not customer_name:
        raise ValidationError(
            {
                "customer_name": (
                    "Customer name is required."
                )
            }
        )

    return customer_name


def normalize_email(
    email,
):
    return (
        email or ""
    ).strip()


@transaction.atomic
def create_customer(
    *,
    customer_name,
    phone_number,
    email="",
    customer_type=Customer.CustomerType.INDIVIDUAL,
    company_name="",
    trn="",
    trade_license_number="",
    agent=None,
    documents=None,
):
    customer_name = validate_customer_name(
        customer_name,
    )

    phone_number = normalize_phone_number(
        phone_number,
    )

    email = normalize_email(
        email,
    )

    customer = (
        Customer.objects
        .filter(
            phone_number=phone_number,
        )
        .first()
    )

    if customer is not None:
        created = False
    else:
        customer = Customer.objects.create(
            customer_name=customer_name,
            phone_number=phone_number,
            email=email,
            customer_type=customer_type,
            company_name=company_name,
            trn=trn,
            trade_license_number=trade_license_number,
            agent=agent,
        )
        created = True

    created_documents = []

    for document_data in documents or []:
        created_documents.append(
            CustomerDocument.objects.create(
                customer=customer,
                category=document_data["category"],
                document=document_data["document"],
            )
        )

    return {
        "customer": customer,
        "created": created,
        "documents": created_documents,
    }


@transaction.atomic
def update_customer(
    *,
    customer,
    customer_name=None,
    phone_number=None,
    email=None,
    customer_type=None,
    company_name=None,
    trn=None,
    trade_license_number=None,
):
    if customer_name is not None:
        customer.customer_name = validate_customer_name(
            customer_name,
        )

    if phone_number is not None:
        normalized_phone = normalize_phone_number(
            phone_number,
        )

        existing_customer = (
            Customer.objects
            .filter(
                phone_number=normalized_phone,
            )
            .exclude(
                pk=customer.pk,
            )
            .first()
        )

        if existing_customer is not None:
            raise ValidationError(
                {
                    "phone_number": (
                        "Another customer already "
                        "exists with this phone number."
                    )
                }
            )

        customer.phone_number = normalized_phone

    if email is not None:
        customer.email = normalize_email(
            email,
        )

    if customer_type is not None:
        customer.customer_type = customer_type

    if customer.customer_type == Customer.CustomerType.INDIVIDUAL:
        customer.company_name = ""
        customer.trn = ""
        customer.trade_license_number = ""
    else:
        if company_name is not None:
            customer.company_name = company_name

        if trn is not None:
            customer.trn = trn

        if trade_license_number is not None:
            customer.trade_license_number = trade_license_number

    customer.save()

    return customer

@transaction.atomic
def delete_customer(
    *,
    customer,
):
    customer.delete()


@transaction.atomic
def create_customer_document(
    *,
    customer,
    category,
    document,
):
    return CustomerDocument.objects.create(
        customer=customer,
        category=category,
        document=document,
    )


@transaction.atomic
def delete_customer_document(
    *,
    document,
):
    document_file = document.document

    document.delete()

    if document_file:
        document_file.delete(save=False)
