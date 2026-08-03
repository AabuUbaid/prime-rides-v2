from django.urls import path

from .views import CarAPIView,CarDetailAPIView,CarImageCoverAPIView

app_name = "inventory"

urlpatterns = [
    path(
        "cars/",
        CarAPIView.as_view(),
        name="cars",
    ),
    path(
        "cars/<uuid:car_id>/",
        CarDetailAPIView.as_view(),
        name="car-detail",
    ),
    
    path(
    "images/<uuid:image_id>/cover/",
    CarImageCoverAPIView.as_view(),
    name="set-cover-image",
    ),
]