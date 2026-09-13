from django.urls import path

from .views import (
    ProgressionDetailView,
    ProgressionListView,
    ProgressionAdvanceView
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
]