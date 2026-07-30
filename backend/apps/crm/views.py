from __future__ import annotations

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status
from rest_framework.generics import GenericAPIView

from apps.common.responses import api_success
from apps.crm import selectors
from apps.crm.filters import CustomerFilter, LeadFilter
from apps.crm.permissions import CanCreateCRM, CanDeleteCRM, CanEditCRM, CanViewCRM
from apps.crm.serializers import (
    CustomerDetailSerializer,
    CustomerListSerializer,
    CustomerWriteSerializer,
    LeadDetailSerializer,
    LeadListSerializer,
    LeadStatusSerializer,
    LeadWriteSerializer,
)
from apps.crm.services.customer import create_customer, delete_customer, update_customer
from apps.crm.services.lead import change_lead_status, create_lead, delete_lead, update_lead


class CustomerListCreateAPIView(GenericAPIView):
    filterset_class = CustomerFilter
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["first_name", "last_name", "company_name", "email", "phone_number"]
    ordering_fields = ["created_at", "first_name", "company_name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return selectors.list_customers()

    def get_permissions(self):
        permission_class = CanCreateCRM if self.request.method == "POST" else CanViewCRM
        return [permission_class()]

    def get(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = CustomerListSerializer(queryset, many=True)
        return api_success("Customers retrieved successfully.", serializer.data)

    def post(self, request):
        serializer = CustomerWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = create_customer(user=request.user, **serializer.validated_data)
        data = CustomerDetailSerializer(customer).data
        return api_success(
            "Customer created successfully.",
            data,
            status_code=status.HTTP_201_CREATED,
        )


class CustomerDetailAPIView(GenericAPIView):
    def get_permissions(self):
        permission_map = {
            "GET": CanViewCRM,
            "PATCH": CanEditCRM,
            "DELETE": CanDeleteCRM,
        }
        return [permission_map[self.request.method]()]

    def get(self, request, customer_id):
        customer = selectors.get_customer(customer_id)
        return api_success(
            "Customer retrieved successfully.",
            CustomerDetailSerializer(customer).data,
        )

    def patch(self, request, customer_id):
        customer = selectors.get_customer(customer_id)
        serializer = CustomerWriteSerializer(customer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        customer = update_customer(
            customer=customer,
            user=request.user,
            **serializer.validated_data,
        )
        return api_success(
            "Customer updated successfully.",
            CustomerDetailSerializer(customer).data,
        )

    def delete(self, request, customer_id):
        customer = selectors.get_customer(customer_id)
        delete_customer(customer=customer, user=request.user)
        return api_success("Customer deleted successfully.", None)


class LeadListCreateAPIView(GenericAPIView):
    filterset_class = LeadFilter
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "customer__first_name",
        "customer__last_name",
        "customer__company_name",
        "customer__phone_number",
        "interested_vehicle__stock_number",
        "interested_vehicle__vin",
    ]
    ordering_fields = ["created_at", "expected_purchase_date", "priority", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return selectors.list_leads()

    def get_permissions(self):
        permission_class = CanCreateCRM if self.request.method == "POST" else CanViewCRM
        return [permission_class()]

    def get(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = LeadListSerializer(queryset, many=True, context={"request": request})
        return api_success("Leads retrieved successfully.", serializer.data)

    def post(self, request):
        serializer = LeadWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = create_lead(user=request.user, **serializer.validated_data)
        data = LeadDetailSerializer(lead, context={"request": request}).data
        return api_success(
            "Lead created successfully.",
            data,
            status_code=status.HTTP_201_CREATED,
        )


class LeadDetailAPIView(GenericAPIView):
    def get_permissions(self):
        permission_map = {
            "GET": CanViewCRM,
            "PATCH": CanEditCRM,
            "DELETE": CanDeleteCRM,
        }
        return [permission_map[self.request.method]()]

    def get(self, request, lead_id):
        lead = selectors.get_lead(lead_id)
        data = LeadDetailSerializer(lead, context={"request": request}).data
        return api_success("Lead retrieved successfully.", data)

    def patch(self, request, lead_id):
        lead = selectors.get_lead(lead_id)
        serializer = LeadWriteSerializer(lead, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        lead = update_lead(lead=lead, user=request.user, **serializer.validated_data)
        data = LeadDetailSerializer(lead, context={"request": request}).data
        return api_success("Lead updated successfully.", data)

    def delete(self, request, lead_id):
        lead = selectors.get_lead(lead_id)
        delete_lead(lead=lead, user=request.user)
        return api_success("Lead deleted successfully.", None)


class LeadStatusAPIView(GenericAPIView):
    permission_classes = [CanEditCRM]
    serializer_class = LeadStatusSerializer

    def post(self, request, lead_id):
        lead = selectors.get_lead(lead_id)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = change_lead_status(
            lead=lead,
            user=request.user,
            **serializer.validated_data,
        )
        data = LeadDetailSerializer(lead, context={"request": request}).data
        return api_success("Lead status updated successfully.", data)
