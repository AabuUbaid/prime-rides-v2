from django.db.models import Q

from .models import Quote


def get_quote(
    quote_id,
):
    return (
        Quote.objects
        .select_related(
            "car",
            "emi_sheet",
            "salesperson",
            "customer",
        )
        .prefetch_related(
            "expenses",
            "customer__documents",
        )
        .get(
            pk=quote_id,
        )
    )


def list_quotes(
    *,
    status=None,
    search=None,
):
    queryset = (
        Quote.objects
        .select_related(
            "car",
            "emi_sheet",
            "salesperson",
            "customer",
        )
        .all()
    )

    # -----------------------------------------------------
    # STATUS FILTER
    # -----------------------------------------------------
    #
    # Supported filters:
    #
    #   all
    #   open
    #   quote
    #   booked
    #   sold
    #   cancelled
    #
    # Open = Quote + Booked
    # -----------------------------------------------------

    if status and status != "all":

        if status == "open":
            queryset = queryset.filter(
                status__in=[
                    Quote.Status.QUOTE,
                    Quote.Status.BOOKED,
                ]
            )

        else:
            queryset = queryset.filter(
                status=status,
            )

    # -----------------------------------------------------
    # SERVER-SIDE SEARCH
    # -----------------------------------------------------

    if search:
        search = search.strip()

        if search:
            queryset = queryset.filter(
                Q(quote_number__icontains=search)
                | Q(customer_name__icontains=search)
                | Q(customer_mobile__icontains=search)
                | Q(vehicle_stock_id__icontains=search)
                | Q(vehicle_make__icontains=search)
                | Q(vehicle_model__icontains=search)
                | Q(vehicle_variant__icontains=search)
                | Q(
                    vehicle_chassis_number__icontains=search
                )
                | Q(
                    vehicle_engine_number__icontains=search
                )
            )

    return queryset.order_by(
        "-created_at",
    )