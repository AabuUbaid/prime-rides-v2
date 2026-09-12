from django.db.models import Q

from .models import Staff


def list_staff(
    *,
    status=None,
    job_role=None,
    search=None,
):
    queryset = (
        Staff.objects
        .select_related("user")
        .all()
    )

    if status:
        queryset = queryset.filter(status=status)

    if job_role:
        queryset = queryset.filter(job_role=job_role)

    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(phone__icontains=search)
            | Q(user__email__icontains=search)
        )

    return queryset


def get_staff(pk):
    return (
        Staff.objects
        .select_related("user")
        .get(pk=pk)
    )