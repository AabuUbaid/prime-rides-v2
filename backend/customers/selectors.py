from django.db.models import Q

from .models import Customer


def get_customer(
    customer_id,
):
    return (
        Customer.objects
        .select_related("agent")
        .prefetch_related("documents")
        .get(
            pk=customer_id,
        )
    )


def list_customers(
    *,
    search=None,
):
    queryset = (
        Customer.objects
        .select_related("agent")
        .all()
    )

    if search:
        search = search.strip()

        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search)
                | Q(phone_number__icontains=search)
                | Q(email__icontains=search)
            )

    return queryset.order_by(
        "-created_at",
    )


def get_customer_by_phone(
    phone_number,
):
    return (
        Customer.objects
        .select_related("agent")
        .prefetch_related("documents")
        .filter(
            phone_number=phone_number,
        )
        .first()
    )