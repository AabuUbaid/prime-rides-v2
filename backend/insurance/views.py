from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsMasterOrAdmin
from quotes.models import Quote
from .models import Insurance


from .serializers import InsuranceSerializer
from .services import (
    approve_new_insurance,
    create_insurance,
    start_insurance_renewal,
    update_insurance_remark,
    update_insurance_renewal_status,
    update_insurance_status,
)

class InsuranceCreateAPIView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def post(self, request, quote_id):
        try:
            quote = Quote.objects.get(
                pk=quote_id,
            )

            insurance = create_insurance(
                quote=quote,
                user=request.user,
            )

            return Response(
                {
                    "success": True,
                    "message": "Insurance created successfully.",
                    "data": InsuranceSerializer(insurance).data,
                },
                status=status.HTTP_201_CREATED,
            )

        except Quote.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Quote not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        exc.messages[0]
                        if getattr(exc, "messages", None)
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
            
class InsuranceStatusUpdateAPIView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def patch(self, request, pk):
        try:
            insurance = Insurance.objects.get(
                pk=pk,
            )

            application_status = request.data.get(
                "application_status"
            )

            if application_status:
                insurance = update_insurance_status(
                    insurance=insurance,
                    application_status=application_status,
                    policy_number=request.data.get(
                        "policy_number"
                    ),
                    expiry_date=request.data.get(
                        "expiry_date"
                    ),
                )

            if "remark" in request.data:
                insurance = update_insurance_remark(
                    insurance=insurance,
                    remark=request.data.get("remark"),
                )

            return Response(
                {
                    "success": True,
                    "message": "Insurance status updated successfully.",
                    "data": InsuranceSerializer(insurance).data,
                },
                status=status.HTTP_200_OK,
            )

        except Insurance.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Insurance not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        exc.messages[0]
                        if getattr(exc, "messages", None)
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
            
            
class InsuranceListAPIView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request):
        insurances = Insurance.objects.all().order_by("-created_at")

        return Response(
            {
                "success": True,
                "data": InsuranceSerializer(
                    insurances,
                    many=True,
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class InsuranceDetailAPIView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request, pk):
        try:
            insurance = Insurance.objects.get(
                pk=pk,
            )

            return Response(
                {
                    "success": True,
                    "data": InsuranceSerializer(
                        insurance
                    ).data,
                },
                status=status.HTTP_200_OK,
            )

        except Insurance.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Insurance not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )
            
class InsuranceRenewalStartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            insurance = Insurance.objects.get(pk=pk)

            insurance = start_insurance_renewal(
                insurance=insurance,
            )

            return Response(
                {
                    "success": True,
                    "message": "Insurance renewal started successfully.",
                    "data": InsuranceSerializer(insurance).data,
                },
                status=status.HTTP_200_OK,
            )

        except Insurance.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Insurance not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        exc.messages[0]
                        if getattr(exc, "messages", None)
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class InsuranceRenewalStatusUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            insurance = Insurance.objects.get(pk=pk)

            renewal_status = request.data.get(
                "renewal_status"
            )

            if not renewal_status:
                return Response(
                    {
                        "success": False,
                        "message": "renewal_status is required.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            insurance = update_insurance_renewal_status(
                insurance=insurance,
                renewal_status=renewal_status,
            )

            if "remark" in request.data:
                insurance = update_insurance_remark(
                    insurance=insurance,
                    remark=request.data.get("remark"),
                )

            return Response(
                {
                    "success": True,
                    "message": "Insurance renewal status updated successfully.",
                    "data": InsuranceSerializer(insurance).data,
                },
                status=status.HTTP_200_OK,
            )

        except Insurance.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Insurance not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        exc.messages[0]
                        if getattr(exc, "messages", None)
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class InsuranceRenewalApproveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            insurance = Insurance.objects.get(pk=pk)

            new_policy = approve_new_insurance(
                insurance=insurance,
                policy_number=request.data.get(
                    "policy_number"
                ),
                expiry_date=request.data.get(
                    "expiry_date"
                ),
            )

            return Response(
                {
                    "success": True,
                    "message": "New Insurance approved successfully.",
                    "data": InsuranceSerializer(
                        insurance
                    ).data,
                    "new_policy": {
                        "id": new_policy.id,
                        "cycle_number": new_policy.cycle_number,
                        "policy_number": new_policy.policy_number,
                        "start_date": new_policy.start_date,
                        "expiry_date": new_policy.expiry_date,
                        "is_active": new_policy.is_active,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Insurance.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Insurance not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        exc.messages[0]
                        if getattr(exc, "messages", None)
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
            
class InsuranceRenewalStartAPIView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def post(self, request, pk):
        try:
            insurance = Insurance.objects.get(pk=pk)

            insurance = start_insurance_renewal(
                insurance=insurance,
            )

            return Response(
                {
                    "success": True,
                    "message": "Insurance renewal started successfully.",
                    "data": InsuranceSerializer(insurance).data,
                },
                status=status.HTTP_200_OK,
            )

        except Insurance.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Insurance not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        exc.messages[0]
                        if getattr(exc, "messages", None)
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class InsuranceRenewalStatusUpdateAPIView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def patch(self, request, pk):
        try:
            insurance = Insurance.objects.get(pk=pk)

            renewal_status = request.data.get(
                "renewal_status"
            )

            if not renewal_status:
                return Response(
                    {
                        "success": False,
                        "message": "renewal_status is required.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            insurance = update_insurance_renewal_status(
                insurance=insurance,
                renewal_status=renewal_status,
            )

            if "remark" in request.data:
                insurance = update_insurance_remark(
                    insurance=insurance,
                    remark=request.data.get("remark"),
                )

            return Response(
                {
                    "success": True,
                    "message": (
                        "Insurance renewal status updated successfully."
                    ),
                    "data": InsuranceSerializer(insurance).data,
                },
                status=status.HTTP_200_OK,
            )

        except Insurance.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Insurance not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        exc.messages[0]
                        if getattr(exc, "messages", None)
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class InsuranceRenewalApproveAPIView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def post(self, request, pk):
        try:
            insurance = Insurance.objects.get(pk=pk)

            new_policy = approve_new_insurance(
                insurance=insurance,
                policy_number=request.data.get(
                    "policy_number"
                ),
                expiry_date=request.data.get(
                    "expiry_date"
                ),
            )

            return Response(
                {
                    "success": True,
                    "message": (
                        "New Insurance approved successfully."
                    ),
                    "data": InsuranceSerializer(
                        insurance
                    ).data,
                    "new_policy": {
                        "id": new_policy.id,
                        "cycle_number": new_policy.cycle_number,
                        "policy_number": new_policy.policy_number,
                        "start_date": new_policy.start_date,
                        "expiry_date": new_policy.expiry_date,
                        "is_active": new_policy.is_active,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Insurance.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Insurance not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except DjangoValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": (
                        exc.messages[0]
                        if getattr(exc, "messages", None)
                        else str(exc)
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )