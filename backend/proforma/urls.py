from django.urls import path

from .views import (
    ProformaDetailAPIView,
    ProformaListCreateAPIView,
)


urlpatterns = [
    path(
        "",
        ProformaListCreateAPIView.as_view(),
        name="proforma-list-create",
    ),
    path(
        "<int:pk>/",
        ProformaDetailAPIView.as_view(),
        name="proforma-detail",
    ),
]