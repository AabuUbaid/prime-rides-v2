from django.urls import path

from .views import (
    BulkVehicleDeleteAPIView,
    BulkImageDeleteAPIView,
    BulkVehicleImportAPIView,
    CarAPIView,
    CarDetailAPIView,
    CarImageCoverAPIView,
    CarExpenseAPIView,
    CarExpenseDetailAPIView,
    CarImageAPIView,
    DashboardAPIView,
    CarImageReorderAPIView,
)

app_name = "inventory"


urlpatterns = [

    # ---------------------------------------------------------
    # Vehicles
    # ---------------------------------------------------------

    path(
        "cars/",
        CarAPIView.as_view(),
        name="cars",
    ),

    path(
        "cars/<uuid:car_id>/",
        CarDetailAPIView.as_view(),
        name="car-detail",
    ),

    # ---------------------------------------------------------
    # Vehicle Bulk Import
    # ---------------------------------------------------------

    path(
        "cars/import/",
        BulkVehicleImportAPIView.as_view(),
        name="import-cars",
    ),

    # ---------------------------------------------------------
    # Expenses
    # ---------------------------------------------------------

    path(
        "cars/<uuid:car_id>/expenses/",
        CarExpenseAPIView.as_view(),
        name="car-expenses",
    ),

    path(
        "expenses/<int:expense_id>/",
        CarExpenseDetailAPIView.as_view(),
        name="expense-detail",
    ),

    # ---------------------------------------------------------
    # Images
    # ---------------------------------------------------------

    path(
        "images/<int:image_id>/cover/",
        CarImageCoverAPIView.as_view(),
        name="set-cover-image",
    ),

    path(
        "images/<int:image_id>/",
        CarImageAPIView.as_view(),
        name="delete-image",
    ),

    path(
        "cars/<uuid:car_id>/images/reorder/",
        CarImageReorderAPIView.as_view(),
        name="reorder-images",
    ),

    # ---------------------------------------------------------
    # Bulk Operations
    # ---------------------------------------------------------

    path(
        "images/bulk-delete/",
        BulkImageDeleteAPIView.as_view(),
        name="bulk-delete-images",
    ),

    path(
        "cars/bulk/",
        BulkVehicleDeleteAPIView.as_view(),
        name="bulk-delete-cars",
    ),

    # ---------------------------------------------------------
    # Dashboard
    # ---------------------------------------------------------

    path(
        "dashboard/",
        DashboardAPIView.as_view(),
        name="dashboard",
    ),
]