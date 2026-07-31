from django.urls import path

from .views import (
    LoginAPIView,
    CurrentUserAPIView,
)

urlpatterns = [
    path("login/", LoginAPIView.as_view(), name="login"),
    path("me/", CurrentUserAPIView.as_view(), name="me"),
]