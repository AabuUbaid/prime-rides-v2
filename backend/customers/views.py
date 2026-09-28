from django.shortcuts import get_object_or_404
from .import_services import (
    import_customers_from_csv,
)
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from config.pagination import StandardResultsSetPagination
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

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)

        serializer = CustomerListSerializer(
            page,
            many=True,
        )

        response = paginator.get_paginated_response(serializer.data)
        response.status_code = status.HTTP_200_OK
        return response

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
            customer_name=serializer.validated_data["customer_name"],
            phone_number=serializer.validated_data["phone_number"],
            email=serializer.validated_data.get(
                "email",
                "",
            ),
            customer_type=serializer.validated_data.get(
                "customer_type",
                Customer.CustomerType.INDIVIDUAL,
            ),
            company_name=serializer.validated_data.get(
                "company_name",
                "",
            ),
            trn=serializer.validated_data.get(
                "trn",
                "",
            ),
            trade_license_number=serializer.validated_data.get(
                "trade_license_number",
                "",
            ),
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
        
class CustomerCSVImportView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def post(
        self,
        request,
    ):
        uploaded_file = request.FILES.get(
            "file"
        )

        if uploaded_file is None:
            return Response(
                {
                    "success": False,
                    "message": (
                        "CSV file is required."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not uploaded_file.name.lower().endswith(
            ".csv"
        ):
            return Response(
                {
                    "success": False,
                    "message": (
                        "Only CSV files are supported."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = import_customers_from_csv(
            uploaded_file=uploaded_file,
            agent=request.user,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Customer CSV import completed."
                ),
                "data": result,
            },
            status=status.HTTP_200_OK,
        )

