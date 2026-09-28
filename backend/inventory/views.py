from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
)
from rest_framework.exceptions import ValidationError
from accounts.permissions import IsMaster
from django.http import QueryDict
from datetime import timedelta
from django.db.models.deletion import ProtectedError
from django.http import FileResponse
from django.utils import timezone
from config.pagination import StandardResultsSetPagination
from django.shortcuts import get_object_or_404
from .models import (
    Car,
    CarExpense,
    SpecialPriceRequest,
    VehicleDocument,
)
from .special_price_services import SpecialPriceService
from .query_serializers import CarListQuerySerializer
from django.db.models import Value

from .serializers import (
    CarCreateSerializer,
    CarListSerializer,
    CarDetailSerializer,
    CarPrintSerializer,
    CarUpdateSerializer,
    CarImageSerializer,
    CarExpenseSerializer,
    ImageReorderSerializer,
    BulkImageDeleteSerializer,
    BulkVehicleDeleteSerializer,
    BulkVehicleImportSerializer,
    SpecialPriceRequestCreateSerializer,
    SpecialPriceRequestSerializer,
    SpecialPriceDecisionSerializer,
    VehicleDocumentSerializer,
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

        paginator = StandardResultsSetPagination()

        page = paginator.paginate_queryset(
            cars,
            request,
        )

        serializer = CarListSerializer(
            page,
            many=True,
            context={
                "request": request,
            },
        )

        return paginator.get_paginated_response(
            serializer.data,
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
            context={
                "request": request,
            },
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
        
class CarPrintAPIView(APIView):
    permission_classes = [IsAuthenticated]

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

        public_stock = (
            request.query_params.get("public_stock", "")
            .lower()
            == "true"
        )

        serializer = CarPrintSerializer(
            cars,
            many=True,
            context={
                "request": request,
                "public_stock": public_stock,
            },
        )

        return Response(
            {
                "success": True,
                "count": len(serializer.data),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

class CarBrandListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        brands = (
            Car.objects
            .exclude(make__isnull=True)
            .exclude(make__exact="")
            .values_list("make", flat=True)
            .distinct()
            .order_by("make")
        )

        return Response(
            {
                "success": True,
                "data": list(brands),
            }
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
            context={
                "request": request,
            },
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
            context={
                "request": request,
            },
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
                            context={
                                "request": request,
                            },
                        ).data
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
            context={
                "request": request,
            },
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
                    context={
                        "request": request,
                    },
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

class DeleteAllInventoryCarsAPIView(APIView):

    permission_classes = [IsAuthenticated, IsMaster]

    def delete(self, request):

        cars = Car.objects.all()

        if not cars.exists():
            return Response(
                {
                    "success": True,
                    "message": "Inventory stock is already empty.",
                    "deleted_count": 0,
                },
                status=status.HTTP_200_OK,
            )

        try:
            deleted_count = InventoryService.delete_all_cars(cars)

        except ProtectedError:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Full inventory deletion was blocked because "
                        "one or more vehicles are referenced by existing "
                        "business records."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {
                "success": True,
                "message": "All inventory stock deleted successfully.",
                "deleted_count": deleted_count,
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
class VehicleDocumentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    parser_classes = (
        MultiPartParser,
        FormParser,
    )

    def get(self, request, car_id):
        car = InventorySelector.get_car_by_id(car_id)

        queryset = (
            VehicleDocument.objects
            .filter(car=car)
            .select_related(
                "uploaded_by",
                "archived_by",
            )
            .order_by("-uploaded_at")
        )

        # Archived documents are visible only to MASTER.
        if request.user.role != "MASTER":
            queryset = queryset.filter(is_archived=False)

        serializer = VehicleDocumentSerializer(
            queryset,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, car_id):
        car = InventorySelector.get_car_by_id(car_id)

        serializer = VehicleDocumentSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        uploaded_file = serializer.validated_data["file"]

        document_type = serializer.validated_data[
            "document_type"
        ]

        document = VehicleDocument.objects.create(
            car=car,
            document_type=document_type,
            file=uploaded_file,
            original_filename=uploaded_file.name,
            mime_type=uploaded_file.content_type,
            file_size=uploaded_file.size,
            uploaded_by=request.user,
        )

        if document_type == VehicleDocument.DocumentType.POSSESSION:
            car.possession_certificate = document.file.name

            car.save(
                update_fields=[
                    "possession_certificate",
                ]
            )

        return Response(
            {
                "success": True,
                "message": "Vehicle document uploaded successfully.",
                "data": VehicleDocumentSerializer(
                    document,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

class VehicleDocumentDownloadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, document_id):
        try:
            document = VehicleDocument.objects.select_related("car").get(
                id=document_id
            )
        except VehicleDocument.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Vehicle document not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Archived documents are not available to non-MASTER users.
        if document.is_archived and request.user.role != "MASTER":
            return Response(
                {
                    "success": False,
                    "message": "You do not have permission to access this document.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # The document must have an actual stored file.
        if not document.file:
            return Response(
                {
                    "success": False,
                    "message": "Document file not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            file_handle = document.file.open("rb")
        except FileNotFoundError:
            return Response(
                {
                    "success": False,
                    "message": "Document file not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        response = FileResponse(
            file_handle,
            content_type=document.mime_type or "application/octet-stream",
        )

        response["Content-Disposition"] = (
            f'attachment; filename="{document.original_filename}"'
        )

        return response

class VehicleDocumentDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _sync_legacy_possession_certificate(car):
        """
        Keep Car.possession_certificate synchronized with
        the latest active POSSESSION VehicleDocument.
        """

        latest_possession = (
            VehicleDocument.objects
            .filter(
                car=car,
                document_type=VehicleDocument.DocumentType.POSSESSION,
                is_archived=False,
            )
            .exclude(file="")
            .order_by("-uploaded_at")
            .first()
        )

        if latest_possession:
            car.possession_certificate = latest_possession.file.name
        else:
            car.possession_certificate = None

        car.save(
            update_fields=[
                "possession_certificate",
            ]
        )

    def delete(self, request, document_id):
        document = get_object_or_404(
            VehicleDocument,
            id=document_id,
        )

        # MASTER can delete any non-archived document.
        if request.user.role == "MASTER":

            car = document.car
            is_possession = (
                document.document_type
                == VehicleDocument.DocumentType.POSSESSION
            )

            document.file.delete(save=False)
            document.delete()

            if is_possession:
                self._sync_legacy_possession_certificate(car)

            return Response(
                {
                    "success": True,
                    "message": "Vehicle document deleted successfully.",
                },
                status=status.HTTP_200_OK,
            )

        # Non-master users can manage only their own uploads.
        if document.uploaded_by_id != request.user.id:
            return Response(
                {
                    "success": False,
                    "message": (
                        "You can delete only documents uploaded by you."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Archived documents cannot be deleted by non-master users.
        if document.is_archived:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Archived documents can only be managed by MASTER."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Non-master users can manage documents only within 24 hours.
        expiry_time = document.uploaded_at + timedelta(hours=24)

        if timezone.now() > expiry_time:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Documents can only be deleted within 24 hours "
                        "of uploading."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        car = document.car
        is_possession = (
            document.document_type
            == VehicleDocument.DocumentType.POSSESSION
        )

        document.file.delete(save=False)
        document.delete()

        if is_possession:
            self._sync_legacy_possession_certificate(car)

        return Response(
            {
                "success": True,
                "message": "Vehicle document deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )
        
class VehicleDocumentArchiveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, document_id):
        document = get_object_or_404(
            VehicleDocument,
            id=document_id,
        )

        if request.user.role != "MASTER":
            return Response(
                {
                    "success": False,
                    "message": "Only MASTER users can archive documents.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if document.is_archived:
            return Response(
                {
                    "success": False,
                    "message": "Document is already archived.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        car = document.car

        is_possession = (
            document.document_type
            == VehicleDocument.DocumentType.POSSESSION
        )

        document.is_archived = True
        document.archived_by = request.user
        document.archived_at = timezone.now()

        document.save(
            update_fields=[
                "is_archived",
                "archived_by",
                "archived_at",
            ]
        )

        if is_possession:
            VehicleDocumentDeleteAPIView._sync_legacy_possession_certificate(
                car
            )

        return Response(
            {
                "success": True,
                "message": "Vehicle document archived successfully.",
                "data": VehicleDocumentSerializer(
                    document,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
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
        
class SpecialPriceRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SpecialPriceRequestCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        special_request = (
            SpecialPriceService.create_request(
                car_id=serializer.validated_data["car_id"],
                requested_price=(
                    serializer.validated_data["requested_price"]
                ),
                requested_by=request.user,
            )
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Special Price enquiry submitted "
                    "successfully."
                ),
                "data": SpecialPriceRequestSerializer(
                    special_request,
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class SpecialPriceRequestListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = (
            SpecialPriceRequest.objects
            .select_related(
                "car",
                "quote",
                "emi_sheet",
                "requested_by",
                "approved_by",
                "used_by",
            )
            .order_by("-created_at")
        )

        if request.user.role != "MASTER":
            queryset = queryset.filter(
                requested_by=request.user,
            )

        SpecialPriceService.expire_queryset(queryset)

        data = []

        for special_request in queryset:
            item = SpecialPriceRequestSerializer(
                special_request,
            ).data

            if request.user.role != "MASTER":
                if not (
                    special_request.status
                    == SpecialPriceRequest.Status.APPROVED
                    and special_request.requested_by_id
                    == request.user.id
                ):
                    item.pop("approved_price", None)
                    item.pop("approved_by", None)
                    item.pop("approved_by_name", None)
                    item.pop("approved_at", None)

            data.append(item)

        return Response(
            {
                "success": True,
                "data": data,
            },
            status=status.HTTP_200_OK,
        )


class SpecialPriceDecisionAPIView(APIView):
    permission_classes = [IsMaster]

    def post(self, request, pk):
        serializer = SpecialPriceDecisionSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        action = serializer.validated_data["action"]

        if action == "approve":
            special_request = (
                SpecialPriceService.approve(
                    request_id=pk,
                    approved_by=request.user,
                    approved_price=(
                        serializer.validated_data.get(
                            "approved_price"
                        )
                    ),
                    expires_at=(
                        serializer.validated_data.get(
                            "expires_at"
                        )
                    ),
                    decision_note=(
                        serializer.validated_data.get(
                            "decision_note",
                            "",
                        )
                    ),
                )
            )

            return Response(
                {
                    "success": True,
                    "message": (
                        "Special Price approved successfully."
                    ),
                    "data": SpecialPriceRequestSerializer(
                        special_request,
                    ).data,
                },
                status=status.HTTP_200_OK,
            )

        special_request = (
            SpecialPriceService.decline(
                request_id=pk,
                declined_by=request.user,
                decision_note=(
                    serializer.validated_data.get(
                        "decision_note",
                        "",
                    )
                ),
            )
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Special Price enquiry declined successfully."
                ),
                "data": SpecialPriceRequestSerializer(
                    special_request,
                ).data,
            },
            status=status.HTTP_200_OK,
        )