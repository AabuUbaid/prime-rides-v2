
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import NotFound
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


from accounts.permissions import IsMaster

from .models import Company, CompanyBranch, CompanyDocument
from .serializers import (
    CompanyBranchSerializer,
    CompanySerializer,
    CompanyDocumentSerializer
)


class CompanyListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMaster,
    ]

    @extend_schema(
        responses=CompanySerializer,
    )
    def get(self, request):
        company = (
            Company.objects
            .prefetch_related("branches")
            .first()
        )

        if not company:
            return Response(
                {
                    "detail": "Company has not been configured yet."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanySerializer(company)

        return Response(serializer.data)

    @extend_schema(
        request=None,
        responses=OpenApiResponse(
            description="Creating additional companies is not allowed.",
        ),
    )
    def post(self, request):
        return Response(
            {
                "detail": (
                    "Only one company is allowed. "
                    "Edit the existing company instead of creating another company."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class CompanyDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMaster,
    ]

    def get_object(self):
        company = (
            Company.objects
            .prefetch_related("branches")
            .first()
        )

        if not company:
            raise NotFound(
                "Company has not been configured yet."
            )

        return company

    @extend_schema(
        responses=CompanySerializer,
    )
    def get(self, request, pk):
        company = self.get_object()

        serializer = CompanySerializer(company)

        return Response(serializer.data)

    @extend_schema(
        request=CompanySerializer,
        responses=CompanySerializer,
    )
    def patch(self, request, pk):
        company = self.get_object()

        serializer = CompanySerializer(
            company,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


class CompanyBranchListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMaster,
    ]

    @extend_schema(
        responses=CompanyBranchSerializer(many=True),
    )
    def get(self, request):
        queryset = CompanyBranch.objects.select_related(
            "company",
        ).all()

        company_id = request.query_params.get("company")

        if company_id:
            queryset = queryset.filter(
                company_id=company_id,
            )

        serializer = CompanyBranchSerializer(
            queryset,
            many=True,
        )

        return Response(serializer.data)

    @extend_schema(
        request=CompanyBranchSerializer,
        responses=OpenApiResponse(
            response=CompanyBranchSerializer,
            description="Branch created successfully.",
        ),
    )
    def post(self, request):
        company = Company.objects.first()

        if not company:
            return Response(
                {
                    "detail": "Company has not been configured yet."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanyBranchSerializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        branch = serializer.save(
            company=company,
        )

        return Response(
            CompanyBranchSerializer(branch).data,
            status=status.HTTP_201_CREATED,
        )

class CompanyBranchDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMaster,
    ]

    @extend_schema(
        responses=CompanyBranchSerializer,
    )
    def get(self, request, pk):
        branch = get_object_or_404(
            CompanyBranch.objects.select_related("company"),
            pk=pk,
        )

        serializer = CompanyBranchSerializer(branch)

        return Response(serializer.data)

    @extend_schema(
        request=CompanyBranchSerializer,
        responses=CompanyBranchSerializer,
    )
    def patch(self, request, pk):
        branch = get_object_or_404(
            CompanyBranch,
            pk=pk,
        )

        serializer = CompanyBranchSerializer(
            branch,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)
    
class CompanyDocumentListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMaster,
    ]

    def get_company(self):
        company = Company.objects.first()

        if not company:
            raise NotFound("Company has not been configured yet.")

        return company

    @extend_schema(
        responses=CompanyDocumentSerializer(many=True),
    )
    def get(self, request):
        company = self.get_company()

        documents = CompanyDocument.objects.filter(
            company=company,
        ).select_related("uploaded_by")

        serializer = CompanyDocumentSerializer(
            documents,
            many=True,
        )

        return Response(serializer.data)

    @extend_schema(
        request=CompanyDocumentSerializer,
        responses=CompanyDocumentSerializer,
    )
    def post(self, request):
        company = self.get_company()

        serializer = CompanyDocumentSerializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        document = serializer.save(
            company=company,
            uploaded_by=request.user,
        )

        return Response(
            CompanyDocumentSerializer(document).data,
            status=status.HTTP_201_CREATED,
        )
        
class CompanyDocumentDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMaster,
    ]

    def get_company(self):
        company = Company.objects.first()

        if not company:
            raise NotFound("Company has not been configured yet.")

        return company

    def get_document(self, company, document_id):
        return get_object_or_404(
            CompanyDocument,
            id=document_id,
            company=company,
        )

    @extend_schema(
        responses=CompanyDocumentSerializer,
    )
    def get(self, request, document_id):
        company = self.get_company()

        document = self.get_document(
            company,
            document_id,
        )

        serializer = CompanyDocumentSerializer(document)

        return Response(serializer.data)

    @extend_schema(
        request=CompanyDocumentSerializer,
        responses=CompanyDocumentSerializer,
    )
    def patch(self, request, document_id):
        company = self.get_company()

        document = self.get_document(
            company,
            document_id,
        )

        serializer = CompanyDocumentSerializer(
            document,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data)

    def delete(self, request, document_id):
        company = self.get_company()

        document = self.get_document(
            company,
            document_id,
        )

        document.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )