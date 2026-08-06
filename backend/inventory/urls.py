from django.urls import path

from .views import (BulkVehicleDeleteAPIView, CarAPIView,CarDetailAPIView,CarImageCoverAPIView, CarExpenseAPIView, CarExpenseDetailAPIView,CarImageAPIView,DashboardAPIView, CarImageReorderAPIView,BulkImageDeleteAPIView,)

app_name = "inventory"

urlpatterns = [
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
    path(
        "cars/<uuid:car_id>/expenses/",
        CarExpenseAPIView.as_view(),
        name="car-expenses",
    ),
    path(
    "images/<uuid:image_id>/cover/",
    CarImageCoverAPIView.as_view(),
    name="set-cover-image",
    ),

    path(
            "expenses/<int:expense_id>/",
            CarExpenseDetailAPIView.as_view(),
            name="expense-detail",
        ),

    path(
        "images/<int:image_id>/",
        CarImageAPIView.as_view(),
        name="delete-image",
    ),

    path(
        "dashboard/",
        DashboardAPIView.as_view(),
        name="dashboard",
    ),

    path(
        "cars/<uuid:car_id>/images/reorder/",
        CarImageReorderAPIView.as_view(),
        name="reorder-images",
    ),

    path(
        "images/delete/",
        BulkImageDeleteAPIView.as_view(),
        name="bulk-delete-images",
    ),

    path(
        "cars/bulk/",
        BulkVehicleDeleteAPIView.as_view(),
        name="bulk-delete-cars",
    ),
    
]