from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from config.pagination import StandardResultsSetPagination

from .models import Lead
from .selectors import (
    get_lead,
    list_leads,
)
from .serializers import (
    LeadActivityCreateSerializer,
    LeadActivitySerializer,
    LeadCreateSerializer,
    LeadSerializer,
    LeadUpdateSerializer,
)
from .services import (
    can_manage_lead,
    create_lead,
    record_activity,
    update_lead,
)


class LeadListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        queryset = list_leads(
            user=request.user,
            enquiry_status=request.query_params.get(
                "enquiry_status",
            ),
            enquiry_source=request.query_params.get(
                "enquiry_source",
            ),
            assigned_to=request.query_params.get(
                "assigned_to",
            ),
            search=request.query_params.get(
                "search",
            ),
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)

        return paginator.get_paginated_response(
            LeadSerializer(page, many=True).data,
        )

    def post(self, request):
        serializer = LeadCreateSerializer(
            data=request.data,
        )
        serializer.is_valid(
            raise_exception=True,
        )

        lead = create_lead(
            actor=request.user,
            **serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": "Lead created successfully.",
                "data": LeadSerializer(
                    lead,
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LeadDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get_object(self, pk, user):
        try:
            return get_lead(
                pk=pk,
                user=user,
            )
        except Lead.DoesNotExist:
            raise NotFound(
                "Lead not found."
            )

    def get(self, request, pk):
        lead = self.get_object(
            pk,
            request.user,
        )

        return Response(
            {
                "success": True,
                "data": LeadSerializer(
                    lead,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        lead = self.get_object(
            pk,
            request.user,
        )

        if not can_manage_lead(
            actor=request.user,
            lead=lead,
        ):
            return Response(
                {
                    "success": False,
                    "message": "Permission denied.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = LeadUpdateSerializer(
            data=request.data,
            partial=True,
        )
        serializer.is_valid(
            raise_exception=True,
        )

        if (
            request.user.role == "SALES_STAFF"
            and "assigned_to" in serializer.validated_data
        ):
            return Response(
                {
                    "success": False,
                    "message": (
                        "Sales Staff cannot reassign leads."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        lead = update_lead(
            lead=lead,
            actor=request.user,
            **serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": "Lead updated successfully.",
                "data": LeadSerializer(
                    lead,
                ).data,
            },
            status=status.HTTP_200_OK,
        )
        
    def delete(self, request, pk):
        if request.user.role != "MASTER":
            return Response(
                {
                    "success": False,
                    "message": "You do not have permission to delete leads.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        lead = self.get_object(pk, request.user)
        lead.delete()

        return Response(
            {
                "success": True,
                "message": "Lead deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )


class LeadActivityCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get_object(self, pk, user):
        try:
            return get_lead(
                pk=pk,
                user=user,
            )
        except Lead.DoesNotExist:
            raise NotFound(
                "Lead not found."
            )

    def post(self, request, pk):
        lead = self.get_object(
            pk,
            request.user,
        )

        if not can_manage_lead(
            actor=request.user,
            lead=lead,
        ):
            return Response(
                {
                    "success": False,
                    "message": "Permission denied.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = LeadActivityCreateSerializer(
            data=request.data,
        )
        serializer.is_valid(
            raise_exception=True,
        )

        activity = record_activity(
            lead=lead,
            actor=request.user,
            **serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Lead activity recorded successfully."
                ),
                "data": LeadActivitySerializer(
                    activity,
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )