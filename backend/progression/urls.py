from django.urls import path

from .views import (
    ProgressionDetailView,
    ProgressionListView,
    ProgressionAdvanceView,
    RegistrationDocumentsView,
    RegistrationDocumentDownloadView
)

urlpatterns = [
    path(
        "",
        ProgressionListView.as_view(),
        name="progression-list",
    ),
    path(
        "<int:pk>/",
        ProgressionDetailView.as_view(),
        name="progression-detail",
    ),
    path(
        "<int:pk>/advance/",
        ProgressionAdvanceView.as_view(),
        name="progression-advance",
    ),
    path(
        "<int:pk>/registration-documents/",
        RegistrationDocumentsView.as_view(),
        name="registration-documents",
    ),
    path(
        "<int:pk>/registration-documents/<str:source>/<str:document_id>/download/",
        RegistrationDocumentDownloadView.as_view(),
        name="registration-document-download",
    ),
]