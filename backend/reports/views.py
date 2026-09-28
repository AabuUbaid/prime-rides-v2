from datetime import date

from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import ReportService


class ReportBaseView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get_report_parameters(self, request):
        period = request.query_params.get(
            "period"
        )

        date_from_raw = request.query_params.get(
            "date_from"
        )

        date_to_raw = request.query_params.get(
            "date_to"
        )

        branch_id = request.query_params.get(
            "branch"
        )

        try:
            date_from = (
                date.fromisoformat(date_from_raw)
                if date_from_raw
                else None
            )

            date_to = (
                date.fromisoformat(date_to_raw)
                if date_to_raw
                else None
            )

        except ValueError:
            raise ValidationError(
                {
                    "date": (
                        "date_from and date_to must use "
                        "YYYY-MM-DD format."
                    )
                }
            )

        try:
            resolved_from, resolved_to = (
                ReportService.get_date_range(
                    period=period,
                    date_from=date_from,
                    date_to=date_to,
                )
            )

        except ValueError as exc:
            raise ValidationError(
                {
                    "period": str(exc)
                }
            )

        return {
            "date_from": resolved_from,
            "date_to": resolved_to,
            "branch_id": branch_id,
        }


class SalesReportView(ReportBaseView):
    def get(self, request):
        params = self.get_report_parameters(
            request
        )

        data = ReportService.sales_report(
            user=request.user,
            **params,
        )

        return Response(data)


class InventoryReportView(ReportBaseView):
    def get(self, request):
        params = self.get_report_parameters(
            request
        )

        data = ReportService.inventory_report(
            user=request.user,
            **params,
        )

        return Response(data)


class CashReceiptReportView(ReportBaseView):
    def get(self, request):
        params = self.get_report_parameters(
            request
        )

        data = ReportService.cash_receipt_report(
            user=request.user,
            **params,
        )

        return Response(data)


class FinanceReportView(ReportBaseView):
    def get(self, request):
        params = self.get_report_parameters(
            request
        )

        data = ReportService.finance_report(
            user=request.user,
            **params,
        )

        return Response(data)


class VehicleAdditionReportView(ReportBaseView):
    def get(self, request):
        params = self.get_report_parameters(
            request
        )

        data = (
            ReportService.vehicle_addition_report(
                user=request.user,
                **params,
            )
        )

        return Response(data)


class VehicleSalesReportView(ReportBaseView):
    def get(self, request):
        params = self.get_report_parameters(
            request
        )

        data = ReportService.vehicle_sales_report(
            user=request.user,
            **params,
        )

        return Response(data)


class OperationalPerformanceReportView(
    ReportBaseView
):
    def get(self, request):
        params = self.get_report_parameters(
            request
        )

        data = (
            ReportService
            .operational_performance_report(
                user=request.user,
                **params,
            )
        )

        return Response(data)