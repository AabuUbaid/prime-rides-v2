from django.urls import path

from .views import (
    CashReceiptReportView,
    FinanceReportView,
    InventoryReportView,
    OperationalPerformanceReportView,
    SalesReportView,
    VehicleAdditionReportView,
    VehicleSalesReportView,
)


urlpatterns = [
    path(
        "sales/",
        SalesReportView.as_view(),
        name="sales-report",
    ),

    path(
        "inventory/",
        InventoryReportView.as_view(),
        name="inventory-report",
    ),

    path(
        "cash-receipts/",
        CashReceiptReportView.as_view(),
        name="cash-receipts-report",
    ),

    path(
        "finance/",
        FinanceReportView.as_view(),
        name="finance-report",
    ),

    path(
        "vehicle-additions/",
        VehicleAdditionReportView.as_view(),
        name="vehicle-additions-report",
    ),

    path(
        "vehicle-sales/",
        VehicleSalesReportView.as_view(),
        name="vehicle-sales-report",
    ),

    path(
        "operational-performance/",
        OperationalPerformanceReportView.as_view(),
        name="operational-performance-report",
    ),
]