from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginAPIView,
    MeAPIView,
    TestPermissionAPIView,
)

urlpatterns = [
    path(
        "login/",
        LoginAPIView.as_view(),
        name="login",
    ),
    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="refresh",
    ),
    path(
        "me/",
        MeAPIView.as_view(),
        name="me",
    ),
    path(
        "test-permission/",
        TestPermissionAPIView.as_view(),
        name="test-permission",
    ),
]