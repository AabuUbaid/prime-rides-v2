from django.urls import path

from .views import (
    RTARecordListCreateView,
    RTAMasterUpdateView,
    RTADocumentListCreateView,
    RTADocumentDownloadView,
    RTADocumentDeleteView,
    RTAGeneratedDocumentView,
)


urlpatterns = [
    path(
        "",
        RTARecordListCreateView.as_view(),
        name="rta-list-create",
    ),
    
    path(
        "<int:pk>/generated-document/",
        RTAGeneratedDocumentView.as_view(),
        name="rta-generated-document",
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