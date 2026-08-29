from django.urls import path

from .views import (
    BankDetailView,
    BankListCreateView,

    ExpensePresetListCreateView,
    ExpensePresetDetailView,

    InsuranceBandListCreateView,
    InsuranceBandDetailView,

    ServicePackageListCreateView,
    ServicePackageDetailView,

    BankProcessingConfigurationListCreateView,
    BankProcessingConfigurationDetailView,

    EmiCalculateView,
    EmiSheetDetailView,
    EmiSheetListCreateView,
)


urlpatterns = [
    # -------------------------------------------------
    # Banks
    # -------------------------------------------------

    path(
        "banks/",
        BankListCreateView.as_view(),
        name="finance-bank-list-create",
    ),

    path(
        "banks/<int:pk>/",
        BankDetailView.as_view(),
        name="finance-bank-detail",
    ),

    # -------------------------------------------------
    # Expense presets
    # -------------------------------------------------

    path(
        "expense-presets/",
        ExpensePresetListCreateView.as_view(),
        name="finance-expense-preset-list-create",
    ),

    path(
        "expense-presets/<int:pk>/",
        ExpensePresetDetailView.as_view(),
        name="finance-expense-preset-detail",
    ),

    # -------------------------------------------------
    # Insurance bands
    # -------------------------------------------------

    path(
        "insurance-bands/",
        InsuranceBandListCreateView.as_view(),
        name="finance-insurance-band-list-create",
    ),

    path(
        "insurance-bands/<int:pk>/",
        InsuranceBandDetailView.as_view(),
        name="finance-insurance-band-detail",
    ),

    # -------------------------------------------------
    # Service packages
    # -------------------------------------------------

    path(
        "service-packages/",
        ServicePackageListCreateView.as_view(),
        name="finance-service-package-list-create",
    ),

    path(
        "service-packages/<int:pk>/",
        ServicePackageDetailView.as_view(),
        name="finance-service-package-detail",
    ),

    # -------------------------------------------------
    # Bank processing configurations
    # -------------------------------------------------

    path(
        "bank-processing-configurations/",
        BankProcessingConfigurationListCreateView.as_view(),
        name="finance-bank-processing-list-create",
    ),

    path(
        "bank-processing-configurations/<int:pk>/",
        BankProcessingConfigurationDetailView.as_view(),
        name="finance-bank-processing-detail",
    ),
    # -------------------------------------------------
    # EMI calculation
    # -------------------------------------------------

    path(
        "emi/calculate/",
        EmiCalculateView.as_view(),
        name="finance-emi-calculate",
    ),

    # -------------------------------------------------
    # EMI sheets
    # -------------------------------------------------

    path(
        "emi/",
        EmiSheetListCreateView.as_view(),
        name="finance-emi-list-create",
    ),

    path(
        "emi/<int:pk>/",
        EmiSheetDetailView.as_view(),
        name="finance-emi-detail",
    ),
]