from django.urls import path

from .views import (
    CompanyBranchDetailView,
    CompanyBranchListCreateView,
    CompanyDetailView,
    CompanyListCreateView,
    CompanyDocumentListCreateView,
    CompanyDocumentDetailView
)


urlpatterns = [
    path(
        "",
        CompanyListCreateView.as_view(),
        name="company-list-create",
    ),

    path(
        "<int:pk>/",
        CompanyDetailView.as_view(),
        name="company-detail",
    ),

    path(
        "branches/",
        CompanyBranchListCreateView.as_view(),
        name="company-branch-list-create",
    ),

    path(
        "branches/<int:pk>/",
        CompanyBranchDetailView.as_view(),
        name="company-branch-detail",
    ),
    path(
        "documents/",
        CompanyDocumentListCreateView.as_view(),
        name="company-document-list-create",
    ),
    path(
        "documents/<int:document_id>/",
        CompanyDocumentDetailView.as_view(),
        name="company-document-detail",
    ),
]