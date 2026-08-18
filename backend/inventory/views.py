from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
)
from rest_framework.exceptions import ValidationError

from django.http import QueryDict

from .pagination import InventoryPagination
from .models import Car, CarExpense

from .query_serializers import CarListQuerySerializer

from .serializers import (
    CarCreateSerializer,
    CarListSerializer,
    CarDetailSerializer,
    CarUpdateSerializer,
    CarImageSerializer,
    CarExpenseSerializer,
    ImageReorderSerializer,
    BulkImageDeleteSerializer,
    BulkVehicleDeleteSerializer,
    BulkVehicleImportSerializer,
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

        query_serializer = CarListQuerySerializer(
            data=request.query_params,
        )

        query_serializer.is_valid(
            raise_exception=True,
        )

        cars = InventorySelector.list_cars(
            **query_serializer.validated_data,
        )

        paginator = InventoryPagination()

        page = paginator.paginate_queryset(
            cars,
            request,
        )

        serializer = CarListSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            {
                "success": True,
                "data": serializer.data,
            }
        )

    def post(self, request):

        data = QueryDict(
            "",
            mutable=True,
        )

        # Copy normal form fields
        for key, value in request.data.items():

            if key != "images":
                data[key] = value

        # Copy uploaded images
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
                    car,
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

    def get(
        self,
        request,
        car_id,
    ):

        car = InventorySelector.get_car_by_id(
            car_id,
        )

        serializer = CarDetailSerializer(
            car,
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            }
        )

    def put(
        self,
        request,
        car_id,
    ):

        car = InventorySelector.get_car_by_id(
            car_id,
        )

        data = QueryDict(
            "",
            mutable=True,
        )

        # Copy normal form fields
        for key, value in request.data.items():

            if key != "images":
                data[key] = value

        # Copy uploaded images
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

    def patch(
        self,
        request,
        car_id,
    ):

        car = InventorySelector.get_car_by_id(
            car_id,
        )

        data = QueryDict(
            "",
            mutable=True,
        )

        # Copy normal form fields
        for key, value in request.data.items():

            if key != "images":
                data[key] = value

        # Copy uploaded images
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

    def delete(
        self,
        request,
        car_id,
    ):

        car = InventorySelector.get_car_by_id(
            car_id,
        )

        InventoryService.delete_car(
            car,
        )

        return Response(
            {
                "success": True,
                "message": "Vehicle deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )


class CarImageCoverAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        image_id,
    ):

        image = InventorySelector.get_image_by_id(
            image_id,
        )

        image = InventoryService.set_cover_image(
            image=image,
        )

        return Response(
            {
                "success": True,
                "message": "Cover image updated successfully.",
                "data": CarImageSerializer(
                    image,
                ).data,
            }
        )


class CarExpenseAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
        car_id,
    ):

        car = InventorySelector.get_car_by_id(
            car_id,
        )

        serializer = CarExpenseSerializer(
            car.expenses.all(),
            many=True,
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            }
        )

    def post(
        self,
        request,
        car_id,
    ):

        car = InventorySelector.get_car_by_id(
            car_id,
        )

        serializer = CarExpenseSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        expense = serializer.save(
            car=car,
        )

        return Response(
            {
                "success": True,
                "data": CarExpenseSerializer(
                    expense,
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CarExpenseDetailAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        expense_id,
    ):

        expense = InventorySelector.get_expense_by_id(
            expense_id,
        )

        serializer = CarExpenseSerializer(
            expense,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        expense = InventoryService.update_expense(
            expense,
            serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "data": CarExpenseSerializer(
                    expense,
                ).data,
            }
        )

    def delete(
        self,
        request,
        expense_id,
    ):

        expense = InventorySelector.get_expense_by_id(
            expense_id,
        )

        InventoryService.delete_expense(
            expense,
        )

        return Response(
            {
                "success": True,
                "message": "Expense deleted successfully.",
            }
        )


class CarImageAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(
        self,
        request,
        image_id,
    ):

        image = InventorySelector.get_image_by_id(
            image_id,
        )

        InventoryService.delete_image(
            image,
        )

        return Response(
            {
                "success": True,
                "message": "Image deleted successfully.",
            }
        )


class DashboardAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
    ):

        data = InventorySelector.dashboard_summary()

        return Response(
            {
                "success": True,
                "data": data,
            }
        )


class CarImageReorderAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        car_id,
    ):

        car = InventorySelector.get_car_by_id(
            car_id,
        )

        serializer = ImageReorderSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        images = InventorySelector.get_car_images(
            car,
        )

        InventoryService.reorder_images(
            car=car,
            images=images,
            image_order=serializer.validated_data[
                "image_order"
            ],
        )

        return Response(
            {
                "success": True,
                "message": "Images reordered successfully.",
            }
        )


class BulkImageDeleteAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
    ):

        serializer = BulkImageDeleteSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        images = InventorySelector.get_images_by_ids(
            serializer.validated_data[
                "image_ids"
            ],
        )

        if images.count() != len(
            serializer.validated_data["image_ids"]
        ):

            raise ValidationError(
                {
                    "image_ids": [
                        "One or more image IDs are invalid."
                    ]
                }
            )

        deleted = InventoryService.bulk_delete_images(
            images,
        )

        return Response(
            {
                "success": True,
                "message": (
                    f"{deleted} image(s) deleted successfully."
                ),
            }
        )


class BulkVehicleDeleteAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(
        self,
        request,
    ):

        serializer = BulkVehicleDeleteSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        cars = InventorySelector.get_cars_by_ids(
            serializer.validated_data[
                "vehicle_ids"
            ],
        )

        if cars.count() != len(
            serializer.validated_data["vehicle_ids"]
        ):

            raise ValidationError(
                {
                    "vehicle_ids": [
                        "One or more vehicle IDs are invalid."
                    ]
                }
            )

        deleted = InventoryService.bulk_delete_vehicles(
            cars,
        )

        return Response(
            {
                "success": True,
                "message": (
                    f"{deleted} vehicle(s) deleted successfully."
                ),
            }
        )

class BulkVehicleImportAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(
        self,
        request,
    ):

        serializer = BulkVehicleImportSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True,
        )

        uploaded_file = (
            serializer.validated_data["file"]
        )

        try:

            rows = (
                InventoryService
                .parse_vehicle_import_file(
                    uploaded_file
                )
            )

            result = (
                InventoryService
                .import_vehicle_rows(
                    rows
                )
            )

        except ValidationError:

            raise

        except Exception as exc:

            raise ValidationError(
                {
                    "bulk_import": [
                        f"Import failed: {str(exc)}"
                    ]
                }
            )

        created_cars = result[
            "created_cars"
        ]

        created_count = result[
            "created_count"
        ]

        skipped_count = result[
            "skipped_count"
        ]

        skipped_rows = result[
            "skipped_rows"
        ]

        errors = result[
            "errors"
        ]

        # -------------------------------------------------
        # Completely successful import
        # -------------------------------------------------

        if skipped_count == 0:

            return Response(
                {
                    "success": True,
                    "message": (
                        f"{created_count} vehicle(s) "
                        "imported successfully."
                    ),
                    "data": {
                        "created_count": (
                            created_count
                        ),
                        "skipped_count": 0,
                        "vehicle_ids": [
                            str(car.id)
                            for car in created_cars
                        ],
                        "errors": [],
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        # -------------------------------------------------
        # Partial import
        # -------------------------------------------------

        return Response(
            {
                "success": True,
                "message": (
                    f"Import completed. "
                    f"{created_count} vehicle(s) "
                    f"imported and "
                    f"{skipped_count} row(s) skipped."
                ),
                "data": {
                    "created_count": (
                        created_count
                    ),
                    "skipped_count": (
                        skipped_count
                    ),
                    "skipped_rows": (
                        skipped_rows
                    ),
                    "vehicle_ids": [
                        str(car.id)
                        for car in created_cars
                    ],
                    "errors": errors,
                },
            },
            status=status.HTTP_201_CREATED,
        )