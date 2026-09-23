
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsMaster

from .models import Company, CompanyBranch
from .serializers import (
    CompanyBranchSerializer,
    CompanySerializer,
)


class CompanyListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMaster,
    ]

    @extend_schema(
        responses=CompanySerializer(many=True),
    )
    def get(self, request):
        companies = Company.objects.prefetch_related(
            "branches"
        ).all()

        serializer = CompanySerializer(
            companies,
            many=True,
        )

        return Response(serializer.data)

    @extend_schema(
        request=CompanySerializer,
        responses=OpenApiResponse(
            response=CompanySerializer,
            description="Company created successfully.",
        ),
    )
    def post(self, request):
        serializer = CompanySerializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        company = serializer.save()

        response_serializer = CompanySerializer(
            company,
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class CompanyDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsMaster,
    ]

    @extend_schema(
        responses=CompanySerializer,
    )
    def get(self, request, pk):
        company = get_object_or_404(
            Company.objects.prefetch_related("branches"),
            pk=pk,
        )

        serializer = CompanySerializer(company)

        return Response(serializer.data)

    @extend_schema(
        request=CompanySerializer,
        responses=CompanySerializer,
    )
    def patch(self, request, pk):
        company = get_object_or_404(
            Company,
            pk=pk,
        )

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
        serializer = CompanyBranchSerializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        branch = serializer.save()

        response_serializer = CompanyBranchSerializer(
            branch,
        )

        return Response(
            response_serializer.data,
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