from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from config.pagination import StandardResultsSetPagination
from rest_framework.exceptions import ValidationError
from . import services
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .models import Progression
from .registration_services import get_registration_documents
from .models import Progression
from .serializers import (
    ProgressionSerializer,
    ProgressionUpdateSerializer,
    ProgressionAdvanceSerializer,
)
from .services import (
    get_progression,
    list_progressions,
)
import os
from io import BytesIO

from django.http import FileResponse
from django.utils.text import get_valid_filename
from PIL import Image, ImageOps
from django.http import FileResponse
from rest_framework.exceptions import (
    NotFound,
    UnsupportedMediaType,
)

from customers.models import CustomerDocument
from inventory.models import VehicleDocument


class ProgressionListView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        queryset = list_progressions(
            user=request.user,
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)

        return paginator.get_paginated_response(
            ProgressionSerializer(page, many=True).data,
        )


class ProgressionDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get_object(self, pk, user):
        return get_progression(
            pk=pk,
            user=user,
        )

    def get(self, request, pk):
        progression = self.get_object(
            pk,
            request.user,
        )

        return Response(
            {
                "success": True,
                "data": ProgressionSerializer(
                    progression,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        if request.user.role not in {
            "MASTER",
            "ADMIN",
        }:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Only Master or Admin can "
                        "update Progression details."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        progression = self.get_object(
            pk,
            request.user,
        )

        serializer = ProgressionUpdateSerializer(
            progression,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        serializer.save()

        return Response(
            {
                "success": True,
                "message": (
                    "Progression updated successfully."
                ),
                "data": ProgressionSerializer(
                    progression,
                ).data,
            },
            status=status.HTTP_200_OK,
        )
        
class ProgressionAdvanceView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request, pk):
        if request.user.role not in {
            "MASTER",
            "ADMIN",
        }:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Only Master or Admin can "
                        "advance Progression."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        progression = get_progression(
            pk=pk,
            user=request.user,
        )

        serializer = ProgressionAdvanceSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            progression = (
                services.advance_progression_stage(
                    progression=progression,
                    user=request.user,
                    override_balance_gate=serializer.validated_data.get(
                        "override_balance_gate",
                        False,
                    ),
                    override_reason=serializer.validated_data.get(
                        "reason",
                    ),
                )
            )

        except ValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": str(exc.detail)
                    if hasattr(exc, "detail")
                    else str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": "Progression advanced successfully.",
                "data": ProgressionSerializer(
                    progression,
                ).data,
            },
            status=status.HTTP_200_OK,
        )
        
        
class RegistrationDocumentsView(APIView):
    """
    Returns all stored customer and vehicle documents
    linked to a progression's quote.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            progression = (
                Progression.objects
                .select_related("quote")
                .get(pk=pk)
            )
        except Progression.DoesNotExist:
            return Response(
                {"detail": "Progression not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        quote = progression.quote

        documents = get_registration_documents(
            quote=quote,
        )

        return Response(
            documents,
            status=status.HTTP_200_OK,
        )
        

class RegistrationDocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def _pdf_filename(self, filename):
        safe_name = get_valid_filename(
            os.path.basename(filename or "document")
        )

        base_name = os.path.splitext(safe_name)[0]

        return f"{base_name}.pdf"

    def _image_to_pdf_response(
        self,
        file_field,
        filename,
    ):
        image = Image.open(file_field)

        image = ImageOps.exif_transpose(image)

        if image.mode in {"RGBA", "LA"}:
            background = Image.new(
                "RGB",
                image.size,
                "white",
            )

            alpha = image.getchannel("A")
            background.paste(
                image,
                mask=alpha,
            )

            image = background

        elif image.mode != "RGB":
            image = image.convert("RGB")

        pdf_buffer = BytesIO()

        image.save(
            pdf_buffer,
            format="PDF",
            resolution=100.0,
        )

        pdf_buffer.seek(0)

        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=self._pdf_filename(filename),
            content_type="application/pdf",
        )

    def get(
        self,
        request,
        pk,
        source,
        document_id,
    ):
        progression = get_progression(
            pk=pk,
            user=request.user,
        )

        quote = progression.quote

        file_field = None
        filename = ""
        content_type = ""

        # -------------------------------------------------
        # Customer document
        # -------------------------------------------------
        if source == "customer":
            try:
                document = CustomerDocument.objects.get(
                    id=document_id,
                    customer=quote.customer,
                )
            except CustomerDocument.DoesNotExist:
                raise NotFound(
                    "Customer document not found."
                )

            file_field = document.document
            filename = os.path.basename(
                file_field.name
            )

        # -------------------------------------------------
        # Vehicle document
        # -------------------------------------------------
        elif source == "vehicle":
            try:
                document = VehicleDocument.objects.get(
                    id=document_id,
                    car=quote.car,
                    is_archived=False,
                )
            except VehicleDocument.DoesNotExist:
                raise NotFound(
                    "Vehicle document not found."
                )

            file_field = document.file
            filename = document.original_filename
            content_type = document.mime_type

        # -------------------------------------------------
        # Legacy possession certificate
        # -------------------------------------------------
        elif source == "vehicle_legacy":
            if str(quote.car.id) != str(document_id):
                raise NotFound(
                    "Legacy vehicle document not found."
                )

            file_field = quote.car.possession_certificate

            if not file_field:
                raise NotFound(
                    "Possession Certificate not found."
                )

            filename = os.path.basename(
                file_field.name
            )

        else:
            raise NotFound(
                "Invalid document source."
            )

        if not file_field:
            raise NotFound(
                "Document file is unavailable."
            )

        try:
            file_field.open("rb")
        except (FileNotFoundError, OSError):
            raise NotFound(
                "Document file is unavailable."
            )

        extension = os.path.splitext(
            filename
        )[1].lower()

        if (
            extension == ".pdf"
            or content_type == "application/pdf"
        ):
            return FileResponse(
                file_field,
                as_attachment=True,
                filename=self._pdf_filename(filename),
                content_type="application/pdf",
            )

        if extension in {
            ".jpg",
            ".jpeg",
            ".png",
        }:
            return self._image_to_pdf_response(
                file_field,
                filename,
            )

        raise UnsupportedMediaType(
            "This document format cannot be converted to PDF."
        )