from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from .models import Car, CarDemand

from .car_demand_serializers import (
    CarDemandSerializer,
    CarDemandVehicleLinkSerializer,
    CarDemandVehicleSerializer,
)

from .car_demand_services import (
    CarDemandMatchingService,
)


class CarDemandAccessMixin:

    def can_manage_demand(self, request, demand):
        role = getattr(request.user, "role", None)

        if role == "MASTER":
            return True

        return (
            demand.created_by_id == request.user.id
            or demand.agent_id == request.user.id
        )

    def get_visible_demands(self, request):
        role = getattr(request.user, "role", None)

        queryset = CarDemand.objects.select_related(
            "agent",
            "created_by",
        ).prefetch_related(
            "matched_vehicles",
        )

        if role == "MASTER":
            return queryset

        return queryset.filter(
            created_by=request.user,
        )

class CarDemandPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

class CarDemandListCreateAPIView(
    CarDemandAccessMixin,
    APIView,
):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        demands = self.get_visible_demands(request)

        search = request.query_params.get(
            "search",
            "",
        ).strip()

        status_filter = request.query_params.get(
            "status",
            "",
        ).strip()

        make = request.query_params.get(
            "make",
            "",
        ).strip()

        model = request.query_params.get(
            "model",
            "",
        ).strip()

        if search:
            from django.db.models import Q

            demands = demands.filter(
                Q(customer_name__icontains=search)
                | Q(phone__icontains=search)
                | Q(make__icontains=search)
                | Q(model__icontains=search)
            )

        if status_filter:
            demands = demands.filter(
                status=status_filter,
            )

        if make:
            demands = demands.filter(
                make__icontains=make,
            )

        if model:
            demands = demands.filter(
                model__icontains=model,
            )

        paginator = CarDemandPagination()

        paginated_demands = paginator.paginate_queryset(
            demands,
            request,
            view=self,
        )

        serializer = CarDemandSerializer(
            paginated_demands,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "success": True,
                "count": paginator.page.paginator.count,
                "next": paginator.get_next_link(),
                "previous": paginator.get_previous_link(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = CarDemandSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        demand = serializer.save(
            agent=request.user,
            created_by=request.user,
        )

        return Response(
            {
                "success": True,
                "message": "Car demand created successfully.",
                "data": CarDemandSerializer(
                    demand,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CarDemandDetailAPIView(
    CarDemandAccessMixin,
    APIView,
):
    permission_classes = [IsAuthenticated]

    def get_demand(self, request, demand_id):
        demand = get_object_or_404(
            CarDemand.objects.prefetch_related(
                "matched_vehicles",
            ),
            id=demand_id,
        )

        if not self.can_manage_demand(
            request,
            demand,
        ):
            return None

        return demand

    def get(self, request, demand_id):
        demand = self.get_demand(
            request,
            demand_id,
        )

        if demand is None:
            return Response(
                {
                    "success": False,
                    "message": "You do not have access to this demand.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {
                "success": True,
                "data": CarDemandSerializer(
                    demand,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, demand_id):
        demand = self.get_demand(
            request,
            demand_id,
        )

        if demand is None:
            return Response(
                {
                    "success": False,
                    "message": "You do not have access to this demand.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CarDemandSerializer(
            demand,
            data=request.data,
            partial=True,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        demand = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Car demand updated successfully.",
                "data": CarDemandSerializer(
                    demand,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, demand_id):
        demand = self.get_demand(
            request,
            demand_id,
        )

        if demand is None:
            return Response(
                {
                    "success": False,
                    "message": "You do not have access to this demand.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        demand.delete()

        return Response(
            {
                "success": True,
                "message": "Car demand deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )


class CarDemandMatchesAPIView(
    CarDemandAccessMixin,
    APIView,
):
    permission_classes = [IsAuthenticated]

    def get(self, request, demand_id):
        demand = get_object_or_404(
            CarDemand,
            id=demand_id,
        )

        if not self.can_manage_demand(
            request,
            demand,
        ):
            return Response(
                {
                    "success": False,
                    "message": "You do not have access to this demand.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        vehicles = CarDemandMatchingService.get_matching_vehicles(
            demand,
        )

        serializer = CarDemandVehicleSerializer(
            vehicles,
            many=True,
        )

        return Response(
            {
                "success": True,
                "count": vehicles.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class CarDemandLinkVehicleAPIView(
    CarDemandAccessMixin,
    APIView,
):
    permission_classes = [IsAuthenticated]

    def post(self, request, demand_id):
        demand = get_object_or_404(
            CarDemand,
            id=demand_id,
        )

        if not self.can_manage_demand(
            request,
            demand,
        ):
            return Response(
                {
                    "success": False,
                    "message": "You do not have access to this demand.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CarDemandVehicleLinkSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        vehicle_ids = serializer.validated_data[
            "vehicle_ids"
        ]

        vehicles = Car.objects.filter(
            id__in=vehicle_ids,
            status=Car.Status.AVAILABLE,
        )

        demand.matched_vehicles.add(
            *vehicles,
        )

        if demand.status != CarDemand.Status.CLOSED:
            demand.status = CarDemand.Status.MATCHED
            demand.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

        return Response(
            {
                "success": True,
                "message": "Vehicles linked successfully.",
                "data": CarDemandSerializer(
                    demand,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class CarDemandUnlinkVehicleAPIView(
    CarDemandAccessMixin,
    APIView,
):
    permission_classes = [IsAuthenticated]

    def post(self, request, demand_id):
        demand = get_object_or_404(
            CarDemand,
            id=demand_id,
        )

        if not self.can_manage_demand(
            request,
            demand,
        ):
            return Response(
                {
                    "success": False,
                    "message": "You do not have access to this demand.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CarDemandVehicleLinkSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        vehicle_ids = serializer.validated_data[
            "vehicle_ids"
        ]

        demand.matched_vehicles.remove(
            *vehicle_ids,
        )

        if (
            demand.status == CarDemand.Status.MATCHED
            and not demand.matched_vehicles.exists()
        ):
            demand.status = CarDemand.Status.OPEN
            demand.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

        return Response(
            {
                "success": True,
                "message": "Vehicles unlinked successfully.",
                "data": CarDemandSerializer(
                    demand,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )