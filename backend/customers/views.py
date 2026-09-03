from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from .models import Customer, CustomerDocument
from .selectors import (
    get_customer,
    list_customers,
)
from .serializers import (
    CustomerCreateSerializer,
    CustomerDetailSerializer,
    CustomerDocumentCreateSerializer,
    CustomerDocumentSerializer,
    CustomerListSerializer,
    CustomerUpdateSerializer,
)
from .services import (
    create_customer,
    create_customer_document,
    delete_customer,
    delete_customer_document,
    update_customer,
)


class CustomerListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(
        self,
        request,
    ):
        queryset = list_customers(
            search=request.query_params.get(
                "search",
            ),
        )

        serializer = CustomerListSerializer(
            queryset,
            many=True,
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(
        self,
        request,
    ):
        serializer = CustomerCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        result = create_customer(
            customer_name=serializer.validated_data[
                "customer_name"
            ],
            phone_number=serializer.validated_data[
                "phone_number"
            ],
            agent=request.user,
            documents=serializer.validated_data.get(
                "documents",
                [],
            ),
        )

        customer = result["customer"]

        message = (
            "Customer created successfully."
            if result["created"]
            else (
                "Customer already exists with this "
                "phone number. Existing customer reused."
            )
        )

        return Response(
            {
                "success": True,
                "message": message,
                "data": CustomerDetailSerializer(
                    customer,
                ).data,
            },
            status=(
                status.HTTP_201_CREATED
                if result["created"]
                else status.HTTP_200_OK
            ),
        )


class CustomerDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get_object(
        self,
        pk,
    ):
        return get_object_or_404(
            Customer.objects
            .select_related("agent")
            .prefetch_related("documents"),
            pk=pk,
        )

    def get(
        self,
        request,
        pk,
    ):
        customer = self.get_object(pk)

        return Response(
            {
                "success": True,
                "data": CustomerDetailSerializer(
                    customer,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(
        self,
        request,
        pk,
    ):
        customer = self.get_object(pk)

        serializer = CustomerUpdateSerializer(
            customer,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            customer = update_customer(
                customer=customer,
                **serializer.validated_data,
            )
        except ValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": (
                    "Customer updated successfully."
                ),
                "data": CustomerDetailSerializer(
                    customer,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(
        self,
        request,
        pk,
    ):
        customer = self.get_object(pk)

        delete_customer(
            customer=customer,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Customer deleted successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )


class CustomerDocumentListCreateView(
    APIView
):
    permission_classes = [
        IsAuthenticated,
    ]

    def get_customer_object(
        self,
        pk,
    ):
        return get_object_or_404(
            Customer,
            pk=pk,
        )

    def get(
        self,
        request,
        pk,
    ):
        customer = self.get_customer_object(pk)

        documents = CustomerDocument.objects.filter(
            customer=customer,
        ).order_by(
            "category",
            "id",
        )

        serializer = CustomerDocumentSerializer(
            documents,
            many=True,
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(
        self,
        request,
        pk,
    ):
        customer = self.get_customer_object(pk)

        serializer = CustomerDocumentCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        document = create_customer_document(
            customer=customer,
            **serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Customer document uploaded successfully."
                ),
                "data": CustomerDocumentSerializer(
                    document,
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerDocumentDetailView(
    APIView
):
    permission_classes = [
        IsAuthenticated,
    ]

    def delete(
        self,
        request,
        customer_pk,
        pk,
    ):
        document = get_object_or_404(
            CustomerDocument,
            pk=pk,
            customer_id=customer_pk,
        )

        delete_customer_document(
            document=document,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Customer document deleted successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )