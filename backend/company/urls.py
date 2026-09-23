from django.urls import path

from .views import (
    CompanyBranchDetailView,
    CompanyBranchListCreateView,
    CompanyDetailView,
    CompanyListCreateView,
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
]