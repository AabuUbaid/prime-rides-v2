from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import (
    NotFound,
    ValidationError,
)

from .models import Quote
from .selectors import get_quote, list_quotes
from .serializers import (
    QuoteCreateSerializer,
    QuoteDetailSerializer,
    QuoteListSerializer,
    QuoteUpdateSerializer,
    QuotePrintSerializer,
    QuoteProceedToBankLoanSerializer,
)

from .services import (
    create_quote,
    update_quote,
    proceed_quote_to_bank_loan,
    proceed_quote_to_cash_deal,
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
        
        
# =========================================================
# PROCEED TO BANK LOAN
# =========================================================

class QuoteProceedToBankLoanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            quote = get_quote(pk)
        except Quote.DoesNotExist:
            raise NotFound("Quote not found.")
        
        serializer = QuoteProceedToBankLoanSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            bank_loan = proceed_quote_to_bank_loan(
                quote=quote,
                bank_id=serializer.validated_data["bank_id"],
                agent=request.user,
                priority=serializer.validated_data.get(
                    "priority"
                ),
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
                    "Quote successfully proceeded "
                    "to Bank Loan."
                ),
                "data": {
                    "bank_loan_id": bank_loan.id,
                    "quote_id": quote.id,
                },
            },
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# PROCEED TO CASH DEAL
# =========================================================

class QuoteProceedToCashDealView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            quote = get_quote(pk)
        except Quote.DoesNotExist:
            raise NotFound("Quote not found.")

        try:
            cash_deal = proceed_quote_to_cash_deal(
                quote=quote,
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
                    "Quote successfully proceeded "
                    "to Cash Deal."
                ),
                "data": {
                    "cash_deal_id": cash_deal.id,
                    "quote_id": quote.id,
                },
            },
            status=status.HTTP_201_CREATED,
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