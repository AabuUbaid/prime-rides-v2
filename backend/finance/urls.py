from django.urls import path

from .views import (
    BankDetailView,
    BankListCreateView,
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