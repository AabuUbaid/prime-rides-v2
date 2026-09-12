from django.urls import path

from .views import (
    InsuranceCreateAPIView,
    InsuranceDetailAPIView,
    InsuranceListAPIView,
    InsuranceRenewalApproveAPIView,
    InsuranceRenewalStartAPIView,
    InsuranceRenewalStatusUpdateAPIView,
    InsuranceStatusUpdateAPIView,
)


urlpatterns = [
    path(
        "",
        InsuranceListAPIView.as_view(),
        name="insurance-list",
    ),
    path(
        "quotes/<int:quote_id>/create/",
        InsuranceCreateAPIView.as_view(),
        name="insurance-create",
    ),
    path(
        "<int:pk>/",
        InsuranceDetailAPIView.as_view(),
        name="insurance-detail",
    ),
    path(
        "<int:pk>/status/",
        InsuranceStatusUpdateAPIView.as_view(),
        name="insurance-status-update",
    ),
    path(
        "<int:pk>/renewal/start/",
        InsuranceRenewalStartAPIView.as_view(),
        name="insurance-renewal-start",
    ),
    path(
        "<int:pk>/renewal/status/",
        InsuranceRenewalStatusUpdateAPIView.as_view(),
        name="insurance-renewal-status",
    ),
    path(
        "<int:pk>/renewal/approve/",
        InsuranceRenewalApproveAPIView.as_view(),
        name="insurance-renewal-approve",
),
]