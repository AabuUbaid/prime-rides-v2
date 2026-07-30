import django_filters

from apps.crm.models import Customer, Lead


class CustomerFilter(django_filters.FilterSet):
    customer_type = django_filters.CharFilter()
    assigned_to = django_filters.UUIDFilter(field_name="assigned_to_id")
    city = django_filters.CharFilter(lookup_expr="iexact")
    created_after = django_filters.DateFilter(
        field_name="created_at",
        lookup_expr="date__gte",
    )
    created_before = django_filters.DateFilter(
        field_name="created_at",
        lookup_expr="date__lte",
    )

    class Meta:
        model = Customer
        fields = []


class LeadFilter(django_filters.FilterSet):
    customer = django_filters.UUIDFilter(field_name="customer_id")
    interested_vehicle = django_filters.UUIDFilter(field_name="interested_vehicle_id")
    assigned_to = django_filters.UUIDFilter(field_name="assigned_to_id")
    source = django_filters.CharFilter()
    status = django_filters.CharFilter()
    priority = django_filters.CharFilter()
    expected_after = django_filters.DateFilter(
        field_name="expected_purchase_date",
        lookup_expr="gte",
    )
    expected_before = django_filters.DateFilter(
        field_name="expected_purchase_date",
        lookup_expr="lte",
    )

    class Meta:
        model = Lead
        fields = []
