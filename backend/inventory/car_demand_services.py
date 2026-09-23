from django.db.models import Q

from .models import Car


class CarDemandMatchingService:

    @staticmethod
    def get_matching_vehicles(demand):
        """
        Return available vehicles matching the demand criteria.

        Matching rules:
        - Status must be available.
        - Make and model are optional.
        - Year range is optional.
        - Budget is treated as maximum asking price.
        - Colour is optional.
        """

        queryset = Car.objects.filter(
            status=Car.Status.AVAILABLE,
        )

        if demand.make:
            queryset = queryset.filter(
                make__iexact=demand.make.strip(),
            )

        if demand.model:
            queryset = queryset.filter(
                model__iexact=demand.model.strip(),
            )

        if demand.year_from is not None:
            queryset = queryset.filter(
                year__gte=demand.year_from,
            )

        if demand.year_to is not None:
            queryset = queryset.filter(
                year__lte=demand.year_to,
            )

        if demand.budget is not None:
            queryset = queryset.filter(
                asking_price__isnull=False,
                asking_price__lte=demand.budget,
            )

        if demand.colour:
            queryset = queryset.filter(
                colour__icontains=demand.colour.strip(),
            )

        return queryset.order_by("-created_at")