from django.urls import path

from .views import (
    BulkVehicleDeleteAPIView,
    BulkImageDeleteAPIView,
    BulkVehicleImportAPIView,
    CarAPIView,
    CarDetailAPIView,
    CarPrintAPIView,
    CarBrandListAPIView,
    CarImageCoverAPIView,
    CarExpenseAPIView,
    CarExpenseDetailAPIView,
    CarImageAPIView,
    DashboardAPIView,
    CarImageReorderAPIView,
    SpecialPriceRequestAPIView,
    SpecialPriceRequestListAPIView,
    SpecialPriceDecisionAPIView,
    VehicleDocumentAPIView,
    VehicleDocumentDeleteAPIView,
    VehicleDocumentArchiveAPIView,
)

from .car_demand_views import (
    CarDemandListCreateAPIView,
    CarDemandDetailAPIView,
    CarDemandMatchesAPIView,
    CarDemandLinkVehicleAPIView,
    CarDemandUnlinkVehicleAPIView,
)

from .procurement_views import (
    ProcurementCheckListCreateView,
    ProcurementCheckDetailView,
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
        "cars/brands/",
        CarBrandListAPIView.as_view(),
        name="car-brands",
    ),
    
    path(
        "cars/print/",
        CarPrintAPIView.as_view(),
        name="car-print",
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
    
    # ---------------------------------------------------------
    # Special Price
    # ---------------------------------------------------------

    path(
        "special-price/",
        SpecialPriceRequestListAPIView.as_view(),
        name="special-price-list",
    ),

    path(
        "special-price/request/",
        SpecialPriceRequestAPIView.as_view(),
        name="special-price-request",
    ),

    path(
        "special-price/<int:pk>/decision/",
        SpecialPriceDecisionAPIView.as_view(),
        name="special-price-decision",
    ),
    
    path(
        "cars/<uuid:car_id>/documents/",
        VehicleDocumentAPIView.as_view(),
        name="vehicle-documents",
    ),

    path(
        "documents/<uuid:document_id>/delete/",
        VehicleDocumentDeleteAPIView.as_view(),
        name="vehicle-document-delete",
    ),

    path(
        "documents/<uuid:document_id>/archive/",
        VehicleDocumentArchiveAPIView.as_view(),
        name="vehicle-document-archive",
    ),
    
    # ---------------------------------------------------------
    # Cars in Demand
    # ---------------------------------------------------------

    path(
        "car-demands/",
        CarDemandListCreateAPIView.as_view(),
        name="car-demand-list-create",
    ),

    path(
        "car-demands/<uuid:demand_id>/",
        CarDemandDetailAPIView.as_view(),
        name="car-demand-detail",
    ),

    path(
        "car-demands/<uuid:demand_id>/matches/",
        CarDemandMatchesAPIView.as_view(),
        name="car-demand-matches",
    ),

    path(
        "car-demands/<uuid:demand_id>/link/",
        CarDemandLinkVehicleAPIView.as_view(),
        name="car-demand-link-vehicle",
    ),

    path(
        "car-demands/<uuid:demand_id>/unlink/",
        CarDemandUnlinkVehicleAPIView.as_view(),
        name="car-demand-unlink-vehicle",
    ),
    path(
        "procurement-checks/",
        ProcurementCheckListCreateView.as_view(),
        name="procurement-check-list-create",
    ),

    path(
        "procurement-checks/<int:pk>/",
        ProcurementCheckDetailView.as_view(),
        name="procurement-check-detail",
    ),
]