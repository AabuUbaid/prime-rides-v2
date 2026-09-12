from django.urls import path

from .views import (
    StaffActivateView,
    StaffDetailView,
    StaffListCreateView,
    UserAccessActivateView,
    UserAccessDetailView,
    UserAccessListCreateView,
    UserAccessPasswordView,
)


urlpatterns = [
    # -------------------------------------------------
    # Staff Management
    # -------------------------------------------------
    path(
        "",
        StaffListCreateView.as_view(),
        name="staff-list-create",
    ),
    path(
        "<int:pk>/",
        StaffDetailView.as_view(),
        name="staff-detail",
    ),
    path(
        "<int:pk>/activate/",
        StaffActivateView.as_view(),
        name="staff-activate",
    ),

    # -------------------------------------------------
    # User Access
    # -------------------------------------------------
    path(
        "user-access/",
        UserAccessListCreateView.as_view(),
        name="user-access-list-create",
    ),
    path(
        "user-access/<uuid:pk>/",
        UserAccessDetailView.as_view(),
        name="user-access-detail",
    ),
    path(
        "user-access/<uuid:pk>/activate/",
        UserAccessActivateView.as_view(),
        name="user-access-activate",
    ),
    path(
        "user-access/<uuid:pk>/password/",
        UserAccessPasswordView.as_view(),
        name="user-access-password",
    ),
]