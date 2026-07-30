import django_filters

from apps.inventory.models import Vehicle


class VehicleFilter(django_filters.FilterSet):
    manufacturer = django_filters.UUIDFilter(
        field_name="vehicle_model__manufacturer_id"
    )

    vehicle_model = django_filters.UUIDFilter(
        field_name="vehicle_model_id"
    )

    generation = django_filters.UUIDFilter(
        field_name="generation_id"
    )

    variant = django_filters.UUIDFilter(
        field_name="variant_id"
    )

    status = django_filters.CharFilter(
        field_name="status__code"
    )

    fuel_type = django_filters.UUIDFilter(
        field_name="fuel_type_id"
    )

    transmission = django_filters.UUIDFilter(
        field_name="transmission_id"
    )

    body_type = django_filters.UUIDFilter(
        field_name="body_type_id"
    )

    drive_type = django_filters.UUIDFilter(
        field_name="drive_type_id"
    )

    engine_type = django_filters.UUIDFilter(
        field_name="engine_type_id"
    )

    published = django_filters.BooleanFilter()

    featured = django_filters.BooleanFilter()

    manufacturing_year = django_filters.NumberFilter()

    model_year = django_filters.NumberFilter()

    minimum_price = django_filters.NumberFilter(
        field_name="selling_price",
        lookup_expr="gte",
    )

    maximum_price = django_filters.NumberFilter(
        field_name="selling_price",
        lookup_expr="lte",
    )

    minimum_mileage = django_filters.NumberFilter(
        field_name="mileage",
        lookup_expr="gte",
    )

    maximum_mileage = django_filters.NumberFilter(
        field_name="mileage",
        lookup_expr="lte",
    )

    class Meta:
        model = Vehicle

        fields = []