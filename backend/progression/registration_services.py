import os

from customers.models import CustomerDocument
from inventory.models import VehicleDocument
from finance.models import BankLoan, CashDeal


REQUIRED_DOCUMENTS = (
    {
        "key": "possession_certificate",
        "label": "Possession Certificate",
    },
    {
        "key": "rta_passing",
        "label": "RTA Passing",
    },
    
)


def _filename_from_path(path):
    return os.path.basename(path or "")


def _build_document(
    *,
    document_id,
    source,
    document_type,
    document_label,
    file_name,
    created_at,
):
    return {
        "id": str(document_id),
        "source": source,
        "document_type": document_type,
        "document_label": document_label,
        "file_name": file_name,
        "download_available": True,
        "file_url": None,
        "created_at": created_at,
    }


def get_registration_documents(*, quote):
    customer = quote.customer
    car = quote.car

    # Quote may not contain the authoritative vehicle directly.
    # Finance uses the approved Bank Loan vehicle, while Cash
    # uses the Cash Deal vehicle.
    if car is None:
        bank_loan = (
            BankLoan.objects
            .filter(
                quote=quote,
                status=BankLoan.Status.APPROVED,
            )
            .select_related("car")
            .order_by("-updated_at", "-id")
            .first()
        )

        if bank_loan is not None:
            car = bank_loan.car

    if car is None:
        cash_deal = (
            CashDeal.objects
            .filter(quote=quote)
            .select_related("car")
            .order_by("-updated_at", "-id")
            .first()
        )

        if cash_deal is not None:
            car = cash_deal.car

    if car is None:
        raise ValueError(
            "Vehicle could not be resolved for this Registration."
        )

    documents = []

    # -------------------------------------------------
    # Customer documents
    # -------------------------------------------------
    customer_documents = (
        CustomerDocument.objects
        .filter(customer=customer)
        .exclude(document="")
        .order_by("category", "id")
    )

    for document in customer_documents:
        if not document.document:
            continue

        documents.append(
            _build_document(
                document_id=document.id,
                source="customer",
                document_type=document.category,
                document_label=document.get_category_display(),
                file_name=_filename_from_path(
                    document.document.name
                ),
                created_at=document.created_at,
            )
        )

    # -------------------------------------------------
    # Vehicle documents
    # -------------------------------------------------
    vehicle_documents = (
        VehicleDocument.objects
        .filter(
            car=car,
            is_archived=False,
        )
        .order_by("-uploaded_at")
    )

    for document in vehicle_documents:
        if not document.file:
            continue

        documents.append(
            _build_document(
                document_id=document.id,
                source="vehicle",
                document_type=document.document_type,
                document_label=document.get_document_type_display(),
                file_name=document.original_filename,
                created_at=document.uploaded_at,
            )
        )

    # -------------------------------------------------
    # Legacy possession certificate
    # -------------------------------------------------
    if car.possession_certificate:
        legacy_exists = any(
            item["document_type"] == "POSSESSION"
            and item["source"] == "vehicle"
            for item in documents
        )

        if not legacy_exists:
            documents.append(
                _build_document(
                    document_id=car.id,
                    source="vehicle_legacy",
                    document_type="POSSESSION",
                    document_label="Possession",
                    file_name=_filename_from_path(
                        car.possession_certificate.name
                    ),
                    created_at=car.created_at,
                )
            )

    # -------------------------------------------------
    # Determine availability by requirement
    # -------------------------------------------------
    available_documents = []
    missing_documents = []

    required_documents = list(REQUIRED_DOCUMENTS)

    if (
        customer.customer_type
        == customer.CustomerType.COMPANY
    ):
        required_documents.append(
            {
                "key": "company_trade_license",
                "label": "Company Trade License",
            }
        )

    

    vehicle_has_possession = any(
        document["source"] in {
            "vehicle",
            "vehicle_legacy",
        }
        and document["document_type"] == "POSSESSION"
        for document in documents
    )

    vehicle_document_types = set(
        VehicleDocument.objects.filter(
            car=car,
            is_archived=False,
        ).values_list("document_type", flat=True)
    )

    availability = {
        "possession_certificate": (
            vehicle_has_possession
            or (
                VehicleDocument.DocumentType.POSSESSION
                in vehicle_document_types
            )
        ),
        "rta_passing": (
            VehicleDocument.DocumentType.RTA_PASSING
            in vehicle_document_types
        ),
        "company_trade_license": any(
            document["source"] == "customer"
            and document["document_type"]
            == CustomerDocument.Category.COMPANY_TRADE_LICENSE
            for document in documents
        ),
    }
 
    for requirement in required_documents:
        key = requirement["key"]

        item = {
            "key": key,
            "label": requirement["label"],
            "available": availability[key],
        }

        if availability[key]:
            available_documents.append(item)
        else:
            missing_documents.append(item)

    return {
        "quote_id": quote.id,
        "customer_id": customer.id,
        "vehicle_id": car.id,
        "total_documents": len(documents),
        "documents": documents,
        "required_documents": [
            {
                "key": requirement["key"],
                "label": requirement["label"],
                "available": availability[requirement["key"]],
            }
            for requirement in required_documents
        ],
        "available_documents": available_documents,
        "missing_documents": missing_documents,
        "registration_documents_ready": (
            len(missing_documents) == 0
        ),
    }