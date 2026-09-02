from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound

from .models import Quote
from .selectors import get_quote, list_quotes
from .serializers import (
    QuoteCreateSerializer,
    QuoteDetailSerializer,
    QuoteListSerializer,
    QuoteUpdateSerializer,
    QuotePrintSerializer
    )

from .services import (
    create_quote,
    update_quote,
)


class QuoteListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = list_quotes(
            status=request.query_params.get("status"),
            search=request.query_params.get("search"),
        )

        serializer = QuoteListSerializer(
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

    def post(self, request):
        serializer = QuoteCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        quote = create_quote(
            **serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": "Quote created successfully.",
                "data": QuoteDetailSerializer(
                    quote,
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class QuoteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return get_quote(pk)
        except Quote.DoesNotExist:
            raise NotFound("Quote not found.")

    def get(self, request, pk):
        quote = self.get_object(pk)

        return Response(
            {
                "success": True,
                "data": QuoteDetailSerializer(
                    quote,
                ).data,
            },
            status=status.HTTP_200_OK,
        )
    def patch(self, request, pk):
        quote = self.get_object(pk)

        serializer = QuoteUpdateSerializer(
            quote,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        validated_data = serializer.validated_data

        expense_updates = validated_data.pop(
            "expense_updates",
            [],
        )

        quote = update_quote(
            quote=quote,
            expense_updates=expense_updates,
            **validated_data,
        )

        quote = self.get_object(pk)

        return Response(
            {
                "success": True,
                "message": "Quote updated successfully.",
                "data": QuoteDetailSerializer(
                    quote,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        if not request.user.role == "MASTER":
            return Response(
                {
                    "success": False,
                    "message": "You do not have permission to delete quotes.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        quote = self.get_object(pk)

        quote.delete()

        return Response(
            {
                "success": True,
                "message": "Quote deleted successfully.",
            },
            status=status.HTTP_200_OK,
        )


class QuotePrintView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return get_quote(pk)
        except Quote.DoesNotExist:
            raise NotFound("Quote not found.")

    def get(self, request, pk):
        quote = self.get_object(pk)

        serializer = QuotePrintSerializer(
            quote,
        )

        return Response(
            {
                "success": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )