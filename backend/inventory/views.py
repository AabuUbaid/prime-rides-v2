from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
)
from .models import Car

from .serializers import (
    CarCreateSerializer,
    CarListSerializer,
    CarDetailSerializer,
    CarUpdateSerializer,
    CarImageSerializer,
)

from .selectors import InventorySelector
from .services import InventoryService


class CarAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (
        MultiPartParser,
        FormParser,
    )

    def get(self, request):
        cars = InventorySelector.list_cars()

        serializer = CarListSerializer(
            cars,
            many=True,
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            }
        )

    def post(self, request):

        data = request.data.copy()

        data.setlist(
            "images",
            request.FILES.getlist("images"),
        )

        serializer = CarCreateSerializer(
            data=data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        car = InventoryService.create_car(
            serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": "Vehicle created successfully.",
                "data": CarCreateSerializer(
                    car
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

class CarDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (
    MultiPartParser,
    FormParser,
)

    def get(self, request, car_id):
        car = InventorySelector.get_car_by_id(car_id)

        serializer = CarDetailSerializer(car)

        return Response(
            {
                "success": True,
                "data": serializer.data,
            }
        )

    def put(self, request, car_id):

        car = InventorySelector.get_car_by_id(
            car_id,
        )

        data = request.data.copy()

        data.setlist(
            "images",
            request.FILES.getlist("images"),
        )

        serializer = CarUpdateSerializer(
            car,
            data=data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        car = InventoryService.update_car(
            car,
            serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": "Vehicle updated successfully.",
                "data": CarDetailSerializer(
                    car,
                ).data,
            }
        )

    def patch(self, request, car_id):

        car = InventorySelector.get_car_by_id(
            car_id,
        )

        data = request.data.copy()

        data.setlist(
            "images",
            request.FILES.getlist("images"),
        )

        serializer = CarUpdateSerializer(
            car,
            data=data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        car = InventoryService.update_car(
            car,
            serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": "Vehicle updated successfully.",
                "data": CarDetailSerializer(
                    car,
                ).data,
            }
        )


class CarImageCoverAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        image_id,
    ):

        image = InventorySelector.get_image_by_id(
            image_id
        )

        image = InventoryService.set_cover_image(
            image=image,
        )

        return Response(
            {
                "success": True,
                "message": "Cover image updated successfully.",
                "data": CarImageSerializer(image).data,
            }
        )