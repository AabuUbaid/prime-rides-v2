from datetime import datetime

from django.db.models import Max

from .models import Car, CarImage


class InventoryService:

    @staticmethod
    def generate_stock_id():

        latest = (
            Car.objects
            .filter(stock_id__startswith="PR-L")
            .aggregate(max_stock=Max("stock_id"))
        )["max_stock"]

        if latest:
            sequence = int(latest.replace("PR-L", "")) + 1
        else:
            sequence = 1

        return f"PR-L{sequence:04d}"

    @staticmethod
    def _save_car_images(
        *,
        car,
        images,
    ):
        """
        Save uploaded gallery images for a vehicle.
        """

        if not images:
            return

        for image in images:
            CarImage.objects.create(
                car=car,
                image=image,
                is_cover=False,
            )

    @staticmethod
    def create_car(validated_data):

        images = validated_data.pop(
            "images",
            [],
        )

        validated_data["stock_id"] = (
            InventoryService.generate_stock_id()
        )

        car = Car.objects.create(
            **validated_data
        )

        InventoryService._save_car_images(
            car=car,
            images=images,
        )

        return car
    
    @staticmethod
    def update_car(
        car,
        validated_data,
    ):

        images = validated_data.pop(
            "images",
            [],
        )

        for field, value in validated_data.items():
            setattr(
                car,
                field,
                value,
            )

        car.save()

        InventoryService._save_car_images(
            car=car,
            images=images,
        )

        return car


    @staticmethod
    def set_cover_image(
        *,
        image,
    ):
        """
        Set one image as the cover image for a vehicle.
        """

        CarImage.objects.filter(
            car=image.car,
            is_cover=True,
        ).update(
            is_cover=False,
        )

        image.is_cover = True

        image.save(
            update_fields=[
                "is_cover",
            ]
        )

        return image
        