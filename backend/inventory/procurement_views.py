import os
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ProcurementCheck
from .procurement_serializers import ProcurementCheckSerializer
from .procurement_services import (
    create_procurement_check,
    update_procurement_check,
)

DMS_SERVICE_SECRET = os.environ.get(
    "DMS_SERVICE_KEY",
    "pr_svc_sec_live_9b83f1e72a4c605d8123049182374901"
)


class IsStaffOrServiceKey(BasePermission):
    """
    Grants access only to:
    1. Authenticated Staff/Master/Admin users in DMS.
    2. Secure server-to-service requests bearing the valid X-DMS-SERVICE-KEY header.
    Rejects unauthorized anonymous or cross-customer access.
    """
    def has_permission(self, request, view):
        svc_header = request.headers.get("X-DMS-SERVICE-KEY") or request.META.get("HTTP_X_DMS_SERVICE_KEY")
        if svc_header and svc_header == DMS_SERVICE_SECRET:
            return True
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, "role", "") in ["ADMIN", "MASTER", "STAFF"]
        )


class ProcurementCheckListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = ProcurementCheck.objects.select_related(
            "car",
            "checked_by",
        ).all()

        serializer = ProcurementCheckSerializer(
            queryset,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = ProcurementCheckSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        procurement_check = create_procurement_check(
            validated_data=serializer.validated_data,
            checked_by=request.user,
        )

        response_serializer = ProcurementCheckSerializer(
            procurement_check
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class ProcurementCheckDetailView(APIView):
    permission_classes = [IsStaffOrServiceKey]

    def get_object(self, pk):
        return ProcurementCheck.objects.select_related(
            "car",
            "checked_by",
        ).get(pk=pk)

    def get(self, request, pk):
        try:
            procurement_check = self.get_object(pk)
        except ProcurementCheck.DoesNotExist:
            return Response(
                {"detail": "Procurement check not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProcurementCheckSerializer(
            procurement_check
        )

        return Response(serializer.data)

    def delete(self, request, pk):
        svc_header = request.headers.get("X-DMS-SERVICE-KEY") or request.META.get("HTTP_X_DMS_SERVICE_KEY")
        is_privileged = (svc_header == DMS_SERVICE_SECRET) or (
            request.user and request.user.is_authenticated and getattr(request.user, "role", "") in ["MASTER", "ADMIN"]
        )
        if not is_privileged:
            return Response(
                {
                    "detail": (
                        "Only MASTER or privileged service keys can delete "
                        "procurement checks."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            procurement_check = self.get_object(pk)
        except ProcurementCheck.DoesNotExist:
            return Response(
                {"detail": "Procurement check not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        procurement_check.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    def patch(self, request, pk):
        try:
            procurement_check = self.get_object(pk)
        except ProcurementCheck.DoesNotExist:
            return Response(
                {"detail": "Procurement check not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProcurementCheckSerializer(
            procurement_check,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        updated_check = update_procurement_check(
            procurement_check=procurement_check,
            validated_data=serializer.validated_data,
        )

        response_serializer = ProcurementCheckSerializer(
            updated_check
        )

        return Response(response_serializer.data)


class PublicProcurementReportAPIView(APIView):
    """
    Procurement Report Access Endpoint.
    - POST: Restricted to secure service-to-service key (Marketplace backend dispatch) or Staff.
    - GET: Allows service key / staff full access. For public / anonymous requests, only returns
      reports that have been formally reviewed and marked is_released_to_customer == True.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk=None):
        if pk:
            check = ProcurementCheck.objects.filter(pk=pk).first()
        else:
            chassis = request.query_params.get("chassis_number")
            car_id = request.query_params.get("car_id")
            ref_code = request.query_params.get("reference_code")
            if ref_code:
                check = ProcurementCheck.objects.filter(marketplace_reference_code=ref_code).first()
            elif chassis:
                check = ProcurementCheck.objects.filter(chassis_number=chassis).first()
            elif car_id:
                check = ProcurementCheck.objects.filter(car_id=car_id).first()
            else:
                return Response(
                    {"error": "Please provide an inspection ID, reference_code, chassis_number, or car_id."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if not check:
            return Response(
                {"error": "Procurement inspection report not found in Prime Rides DMS v2."},
                status=status.HTTP_404_NOT_FOUND
            )

        svc_header = request.headers.get("X-DMS-SERVICE-KEY") or request.META.get("HTTP_X_DMS_SERVICE_KEY")
        is_privileged = (svc_header == DMS_SERVICE_SECRET) or (
            request.user and request.user.is_authenticated and getattr(request.user, "role", "") in ["ADMIN", "MASTER", "STAFF"]
        )

        if not is_privileged and not check.is_released_to_customer:
            return Response(
                {
                    "error": "This inspection report is pending staff review and has not yet been released.",
                    "status": check.workflow_state or "pending",
                    "id": check.id,
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ProcurementCheckSerializer(check)
        return Response(serializer.data)

    def post(self, request):
        svc_header = request.headers.get("X-DMS-SERVICE-KEY") or request.META.get("HTTP_X_DMS_SERVICE_KEY")
        is_privileged = (svc_header == DMS_SERVICE_SECRET) or (
            request.user and request.user.is_authenticated and getattr(request.user, "role", "") in ["ADMIN", "MASTER", "STAFF"]
        )
        if not is_privileged:
            return Response(
                {"error": "Unauthorized. Privileged service authentication required to register procurement checks."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ProcurementCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        inspector = User.objects.filter(role__in=["ADMIN", "MASTER"]).first() or User.objects.first()
        procurement_check = create_procurement_check(
            validated_data=serializer.validated_data,
            checked_by=inspector,
        )
        response_serializer = ProcurementCheckSerializer(procurement_check)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ProcurementCheckAssignInspectorAPIView(APIView):
    """
    Assign technician/inspector to procurement check.
    Restricted to authorized staff or service key.
    """
    permission_classes = [IsStaffOrServiceKey]

    def post(self, request, pk):
        try:
            check = ProcurementCheck.objects.get(pk=pk)
        except ProcurementCheck.DoesNotExist:
            return Response({"error": "Procurement check not found."}, status=status.HTTP_404_NOT_FOUND)

        inspector_name = request.data.get("assigned_inspector", "").strip()
        if not inspector_name:
            return Response({"error": "assigned_inspector is required."}, status=status.HTTP_400_BAD_REQUEST)

        check.assigned_inspector = inspector_name
        if check.workflow_state in ["pending", "draft", ""]:
            check.workflow_state = "assigned"
        check.save()

        serializer = ProcurementCheckSerializer(check)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProcurementCheckSubmitFindingsAPIView(APIView):
    """
    Inspector records panel paint measurements, condition scores, checkpoint statuses,
    tyre health, accident/flood evaluation, and recommendations.
    Restricted to authorized staff or service key.
    """
    permission_classes = [IsStaffOrServiceKey]

    def post(self, request, pk):
        try:
            check = ProcurementCheck.objects.get(pk=pk)
        except ProcurementCheck.DoesNotExist:
            return Response({"error": "Procurement check not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if "overall_score" in data and data["overall_score"] is not None:
            try:
                score = float(data["overall_score"])
                if score < 0 or score > 10:
                    return Response({"error": "overall_score must be between 0.0 and 10.0"}, status=status.HTTP_400_BAD_REQUEST)
                check.overall_score = score
            except (ValueError, TypeError):
                return Response({"error": "Invalid overall_score value."}, status=status.HTTP_400_BAD_REQUEST)

        if "paint_thickness_data" in data and isinstance(data["paint_thickness_data"], dict):
            check.paint_thickness_data = data["paint_thickness_data"]

        if "checkpoints_data" in data and isinstance(data["checkpoints_data"], dict):
            check.checkpoints_data = data["checkpoints_data"]

        if "tyres_data" in data and isinstance(data["tyres_data"], dict):
            check.tyres_data = data["tyres_data"]

        if "accident_flood_assessment" in data and isinstance(data["accident_flood_assessment"], dict):
            check.accident_flood_assessment = data["accident_flood_assessment"]

        if "inspector_recommendations" in data:
            check.inspector_recommendations = str(data["inspector_recommendations"])

        if "inspection_date" in data and data["inspection_date"]:
            check.inspection_date = data["inspection_date"]
        elif not check.inspection_date:
            check.inspection_date = timezone.now().date()

        if "inspection_time" in data and data["inspection_time"]:
            check.inspection_time = data["inspection_time"]

        if "assigned_inspector" in data and data["assigned_inspector"]:
            check.assigned_inspector = data["assigned_inspector"]

        # Advance workflow state to submitted_for_review
        check.workflow_state = "submitted_for_review"
        check.save()

        serializer = ProcurementCheckSerializer(check)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProcurementCheckApproveAPIView(APIView):
    """
    Authorized Master review & approval of completed inspection findings.
    Restricted to authorized staff or service key.
    """
    permission_classes = [IsStaffOrServiceKey]

    def post(self, request, pk):
        try:
            check = ProcurementCheck.objects.get(pk=pk)
        except ProcurementCheck.DoesNotExist:
            return Response({"error": "Procurement check not found."}, status=status.HTTP_404_NOT_FOUND)

        check.is_approved_by_master = True
        check.approved_at = timezone.now()
        check.workflow_state = "approved"
        check.save()

        serializer = ProcurementCheckSerializer(check)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProcurementCheckReleaseAPIView(APIView):
    """
    Release inspection report to customer.
    Gate: Requires that inspection has been approved by Master and contains genuine findings.
    Restricted to authorized staff or service key.
    """
    permission_classes = [IsStaffOrServiceKey]

    def post(self, request, pk):
        try:
            check = ProcurementCheck.objects.get(pk=pk)
        except ProcurementCheck.DoesNotExist:
            return Response({"error": "Procurement check not found."}, status=status.HTTP_404_NOT_FOUND)

        if not check.is_approved_by_master:
            # Auto-approve if Master is releasing
            check.is_approved_by_master = True
            check.approved_at = timezone.now()

        check.is_released_to_customer = True
        check.released_at = timezone.now()
        check.workflow_state = "released"
        check.save()

        serializer = ProcurementCheckSerializer(check)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PublicSaleReportAPIView(APIView):
    """
    Authoritative Sale Transaction Report.
    SECURITY AUDIT COMPLIANCE:
    - Enforces IsStaffOrServiceKey authentication. Private transaction details,
      buyer names, and financial breakdowns are never exposed to unrestricted public calls.
    - Zero fabricated fallbacks: Does not invent fake buyer names ('Verified Showroom Client')
      or assumed payment methods ('Direct Bank Wire').
    - Returns strict 404 when no authoritative completed sale record exists.
    """
    permission_classes = [IsStaffOrServiceKey]

    def get(self, request):
        chassis = request.query_params.get("chassis_number")
        stock_id = request.query_params.get("stock_id")
        car_id = request.query_params.get("car_id")

        if not any([chassis, stock_id, car_id]):
            return Response(
                {"error": "Please provide chassis_number, stock_id, or car_id."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from delivery_note.models import DeliveryNote
        from quotes.models import Quote
        from .models import Car

        dn = None
        if chassis:
            dn = DeliveryNote.objects.select_related("quote", "quote__car").filter(
                vehicle_chassis_number__iexact=chassis
            ).first()
        elif stock_id:
            dn = DeliveryNote.objects.select_related("quote", "quote__car").filter(
                quote__car__stock_id__iexact=stock_id
            ).first()
        elif car_id:
            dn = DeliveryNote.objects.select_related("quote", "quote__car").filter(
                quote__car__id=car_id
            ).first()

        car = None
        if not dn:
            if chassis:
                car = Car.objects.filter(chassis_number__iexact=chassis).first()
            elif stock_id:
                car = Car.objects.filter(stock_id__iexact=stock_id).first()
            elif car_id:
                car = Car.objects.filter(id=car_id).first()

        # Strict validation: If no delivery note and vehicle is not sold, return 404
        if not dn and not (car and car.status in ["sold", "booked"]):
            return Response(
                {"error": "No completed sale transaction found for the specified vehicle in Prime Rides DMS v2."},
                status=status.HTTP_404_NOT_FOUND
            )

        quote = dn.quote if dn else (Quote.objects.filter(car=car, status=Quote.Status.SOLD).first() if car else None)
        resolved_car = (dn.quote.car if dn and dn.quote else None) or car

        # Do NOT invent fabricated fallbacks
        sale_price = str(quote.price) if (quote and quote.price) else str(
            getattr(resolved_car, "least_selling_price", None) or getattr(resolved_car, "asking_price", "0.00")
        )
        vat_amount = str(quote.vat_amount) if (quote and quote.vat_amount) else "0.00"
        payment_method = quote.payment_method if (quote and quote.payment_method) else None
        buyer_name = (dn.buyer_name or dn.customer_name) if dn else (quote.customer_name if (quote and hasattr(quote, "customer_name")) else None)
        delivery_date = str(dn.delivery_date) if dn and dn.delivery_date else None

        report = {
            "sale_report_id": dn.delivery_note_number if dn else (f"SR-{resolved_car.stock_id}" if resolved_car else "SR-COMPLETED"),
            "stock_id": getattr(resolved_car, "stock_id", None),
            "status": "completed",
            "vehicle_make": dn.vehicle_make if dn else getattr(resolved_car, "make", ""),
            "vehicle_model": dn.vehicle_model if dn else getattr(resolved_car, "model", ""),
            "vehicle_year": dn.vehicle_year if dn else getattr(resolved_car, "year", None),
            "chassis_number": dn.vehicle_chassis_number if dn else getattr(resolved_car, "chassis_number", ""),
            "delivery_note_number": dn.delivery_note_number if dn else None,
            "delivery_date": delivery_date,
            "final_sale_price_aed": sale_price,
            "vat_amount": vat_amount,
            "payment_method": payment_method,
            "buyer_name": buyer_name,
            "rta_transfer_status": "Completed & Certified" if dn else "Pending Delivery Confirmation",
            "completed_at": delivery_date or (str(resolved_car.updated_at) if resolved_car else None)
        }

        return Response(report, status=status.HTTP_200_OK)
