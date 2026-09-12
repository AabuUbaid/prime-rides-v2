from django.db.models import Q

from .models import Lead


def list_leads(
    *,
    user,
    enquiry_status=None,
    enquiry_source=None,
    assigned_to=None,
    search=None,
):
    queryset = (
        Lead.objects
        .select_related(
            "created_by",
            "assigned_to",
            "assigned_to__user",
        )
        .prefetch_related(
            "activities",
            "assignment_history",
        )
    )

    if user.role == "SALES_STAFF":
        queryset = queryset.filter(
            assigned_to__user=user,
        )

    if enquiry_status:
        queryset = queryset.filter(
            enquiry_status=enquiry_status,
        )

    if enquiry_source:
        queryset = queryset.filter(
            enquiry_source=enquiry_source,
        )

    if assigned_to:
        queryset = queryset.filter(
            assigned_to_id=assigned_to,
        )

    if search:
        queryset = queryset.filter(
            Q(phone_number__icontains=search)
            | Q(customer_name__icontains=search)
            | Q(email__icontains=search)
            | Q(brand__icontains=search)
            | Q(type_of_car__icontains=search)
        )

    return queryset


def get_lead(*, pk, user):
    queryset = (
        Lead.objects
        .select_related(
            "created_by",
            "assigned_to",
            "assigned_to__user",
        )
        .prefetch_related(
            "activities__created_by",
            "assignment_history__previous_staff",
            "assignment_history__new_staff",
            "assignment_history__changed_by",
        )
    )

    if user.role == "SALES_STAFF":
        queryset = queryset.filter(
            assigned_to__user=user,
        )

    return queryset.get(
        pk=pk,
    )