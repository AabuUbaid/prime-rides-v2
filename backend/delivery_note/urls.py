from django.urls import path

from .views import (
    DeliveryNoteDetailAPIView,
    DeliveryNoteListCreateAPIView,
)


urlpatterns = [
    path(
        "",
        DeliveryNoteListCreateAPIView.as_view(),
        name="delivery-note-list-create",
    ),
    path(
        "<int:pk>/",
        DeliveryNoteDetailAPIView.as_view(),
        name="delivery-note-detail",
    ),
]