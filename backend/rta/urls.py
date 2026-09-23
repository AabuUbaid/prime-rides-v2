from django.urls import path

from .views import (
    RTARecordListCreateView,
    RTAMasterUpdateView,
    RTADocumentListCreateView,
    RTADocumentDownloadView,
    RTADocumentDeleteView,
)


urlpatterns = [
    path(
        "",
        RTARecordListCreateView.as_view(),
        name="rta-list-create",
    ),

    path(
        "<int:pk>/",
        RTAMasterUpdateView.as_view(),
        name="rta-detail",
    ),

    path(
        "<int:rta_record_id>/documents/",
        RTADocumentListCreateView.as_view(),
        name="rta-document-list-create",
    ),

    path(
        "documents/<uuid:pk>/download/",
        RTADocumentDownloadView.as_view(),
        name="rta-document-download",
    ),

    path(
        "documents/<uuid:pk>/delete/",
        RTADocumentDeleteView.as_view(),
        name="rta-document-delete",
    ),
]