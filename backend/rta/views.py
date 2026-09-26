from django.http import FileResponse
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsMasterOrAdmin

from .models import RTARecord, RTADocument
from .serializers import RTARecordSerializer, RTADocumentSerializer
from .services import create_rta_record


class RTARecordListCreateView(generics.ListCreateAPIView):
    queryset = RTARecord.objects.select_related(
        "quote",
        "car",
        "customer",
        "company",
        "branch",
    ).order_by("-created_at")

    serializer_class = RTARecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        quote_id = self.request.query_params.get("quote_id")
        record_type = self.request.query_params.get("record_type")
        status = self.request.query_params.get("status")

        if quote_id:
            queryset = queryset.filter(quote_id=quote_id)

        if record_type:
            queryset = queryset.filter(record_type=record_type)

        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def perform_create(self, serializer):
        quote = serializer.validated_data.get("quote")

        car = serializer.validated_data.get("car")
        customer = serializer.validated_data.get("customer")
        company = serializer.validated_data.get("company")
        branch = serializer.validated_data.get("branch")

        extra_fields = {
            key: value
            for key, value in serializer.validated_data.items()
            if key not in {
                "quote",
                "car",
                "customer",
                "company",
                "branch",
                "snapshot_data",
                "record_type",
            }
        }

        record = create_rta_record(
            record_type=serializer.validated_data["record_type"],
            quote=quote,
            user=self.request.user,
            car=car,
            customer=customer,
            company=company,
            branch=branch,
            **extra_fields,
        )

        serializer.instance = record


class RTAMasterUpdateView(generics.RetrieveUpdateAPIView):
    queryset = RTARecord.objects.select_related(
        "quote",
        "car",
        "customer",
        "company",
        "branch",
    )

    serializer_class = RTARecordSerializer
    permission_classes = [
        IsAuthenticated,
        IsMasterOrAdmin,
    ]
    
class RTADocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = RTADocumentSerializer
    permission_classes = [
        IsAuthenticated,
        IsMasterOrAdmin,
    ]
    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def get_queryset(self):
        rta_record_id = self.kwargs["rta_record_id"]

        return RTADocument.objects.filter(
            rta_record_id=rta_record_id,
        ).select_related(
            "rta_record",
            "uploaded_by",
        )

    def perform_create(self, serializer):
        rta_record = get_object_or_404(
            RTARecord,
            pk=self.kwargs["rta_record_id"],
        )

        uploaded_file = serializer.validated_data["file"]

        serializer.save(
            rta_record=rta_record,
            uploaded_by=self.request.user,
            original_filename=uploaded_file.name,
            mime_type=getattr(
                uploaded_file,
                "content_type",
                "",
            ) or "",
            file_size=uploaded_file.size,
        )


class RTADocumentDownloadView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMasterOrAdmin,
    ]

    def get(self, request, pk):
        document = get_object_or_404(
            RTADocument,
            pk=pk,
        )

        if not document.file:
            return Response(
                {
                    "success": False,
                    "message": "Document file is missing.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return FileResponse(
            document.file.open("rb"),
            as_attachment=True,
            filename=document.original_filename,
        )


class RTADocumentDeleteView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMasterOrAdmin,
    ]

    def delete(self, request, pk):
        document = get_object_or_404(
            RTADocument,
            pk=pk,
        )

        document.file.delete(save=False)
        document.delete()

        return Response(
            {
                "success": True,
                "message": "RTA document deleted successfully.",
            },
            status=status.HTTP_204_NO_CONTENT,
        )