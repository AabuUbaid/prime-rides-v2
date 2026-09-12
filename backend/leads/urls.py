from django.urls import path

from .views import (
    LeadActivityCreateView,
    LeadDetailView,
    LeadListCreateView,
)


urlpatterns = [
    path(
        "",
        LeadListCreateView.as_view(),
        name="lead-list-create",
    ),
    path(
        "<int:pk>/",
        LeadDetailView.as_view(),
        name="lead-detail",
    ),
    path(
        "<int:pk>/activities/",
        LeadActivityCreateView.as_view(),
        name="lead-activity-create",
    ),
]