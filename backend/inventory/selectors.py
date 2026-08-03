from .models import Car, CarImage

from django.shortcuts import get_object_or_404


class InventorySelector:

    @staticmethod
    def list_cars():
        return (
            Car.objects
            .all()
            .order_by("-created_at")
        )

    @staticmethod
    def get_car_by_id(car_id):
        return get_object_or_404(
            Car,
            id=car_id,
        )

    @staticmethod
    def get_car_images(car):
        return (
            CarImage.objects
            .filter(car=car)
            .order_by("-is_cover", "id")
        )

    @staticmethod
    def get_image_by_id(image_id):
        return get_object_or_404(
            CarImage,
            id=image_id,
        )

    