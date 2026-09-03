from django.urls import path

from .views import (
    CustomerDetailView,
    CustomerDocumentDetailView,
    CustomerDocumentListCreateView,
    CustomerListCreateView,
)


urlpatterns = [
    path(
        "",
        CustomerListCreateView.as_view(),
        name="customer-list-create",
    ),

    path(
        "<int:pk>/",
        CustomerDetailView.as_view(),
        name="customer-detail",
    ),

    path(
        "<int:pk>/documents/",
        CustomerDocumentListCreateView.as_view(),
        name="customer-document-list-create",
    ),

    path(
        "<int:customer_pk>/documents/<int:pk>/",
        CustomerDocumentDetailView.as_view(),
        name="customer-document-detail",
    ),
]