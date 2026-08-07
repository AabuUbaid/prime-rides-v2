from datetime import datetime
from django.db import transaction
from rest_framework.exceptions import ValidationError
from django.db.models import Max

from .models import (Car, CarImage, CarExpense,)


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
    def normalize_vehicle_data(validated_data):
        """
        Normalize vehicle data before saving.
        """

        title_fields = [
            "make",
            "model",
            "variant",
            "colour",
            "supplier",
        ]

        for field in title_fields:

            value = validated_data.get(field)

            if value:

                validated_data[field] = (
                    str(value)
                    .strip()
                    .title()
                )

        upper_fields = [
            "chassis_number",
            "engine_number",
        ]

        for field in upper_fields:

            value = validated_data.get(field)

            if value:

                validated_data[field] = (
                    str(value)
                    .strip()
                    .upper()
                )

        return validated_data

    @staticmethod
    def create_car(validated_data):

        images = validated_data.pop(
            "images",
            [],
        )

        validated_data = InventoryService.normalize_vehicle_data(
            validated_data,
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

        remove_certificate = validated_data.pop(
        "remove_certificate",
        False,
    )

        images = validated_data.pop(
            "images",
            [],
        )

        validated_data = InventoryService.normalize_vehicle_data(
            validated_data,
        )

        if remove_certificate:

            if car.possession_certificate:

                car.possession_certificate.delete(
                    save=False,
                )

            car.possession_certificate = None

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

    @staticmethod
    def update_expense(
        expense,
        validated_data,
    ):

        for field, value in validated_data.items():
            setattr(
                expense,
                field,
                value,
            )

        expense.save()

        return expense


    @staticmethod
    def delete_expense(
        expense,
    ):

        expense.delete()

    @staticmethod
    def delete_car(
        car,
    ):

        # Delete certificate file
        if car.possession_certificate:
            car.possession_certificate.delete(
                save=False,
            )

        # Delete image files
        for image in car.images.all():
            image.image.delete(
                save=False,
            )

        car.delete()

    @staticmethod
    def delete_image(image):

        car = image.car

        was_cover = image.is_cover

        image.image.delete(save=False)

        image.delete()

        if was_cover:

            new_cover = (
                CarImage.objects
                .filter(car=car)
                .first()
            )

            if new_cover:

                new_cover.is_cover = True

                new_cover.save(
                    update_fields=[
                        "is_cover",
                    ]
                )


    @staticmethod
    @transaction.atomic
    def reorder_images(
        car,
        images,
        image_order,
    ):
        """
        Reorders images for a vehicle.

        Parameters
        ----------
        car : Car
            Vehicle whose images are being reordered.

        images : QuerySet[CarImage]
            Images belonging to this vehicle.

        image_order : list[int]
            Ordered list of image IDs.
        """

        images_map = {
            image.id: image
            for image in images
        }

        # Validate count
        if len(image_order) != len(images_map):
            raise ValidationError(
                {
                    "image_order": [
                        "Image list is incomplete."
                    ]
                }
            )

        # Validate duplicates
        if len(image_order) != len(set(image_order)):
            raise ValidationError(
                {
                    "image_order": [
                        "Duplicate image IDs detected."
                    ]
                }
            )

        # Validate ownership
        for image_id in image_order:

            if image_id not in images_map:

                raise ValidationError(
                {
                    "image_order": [
                        "One or more images do not belong to this vehicle."
                    ]
                }
            )

        # Update display order
        for order, image_id in enumerate(
            image_order,
            start=1,
        ):

            image = images_map[image_id]

            image.display_order = order

            image.save(
                update_fields=[
                    "display_order",
                ]
            )

        return images

    
    @staticmethod
    @transaction.atomic
    def bulk_delete_images(images):

        deleted_count = 0

        for image in images:

            InventoryService.delete_image(
                image,
            )

            deleted_count += 1

        return deleted_count

    @staticmethod
    @transaction.atomic
    def bulk_delete_vehicles(
        cars,
    ):

        deleted = 0

        for car in cars:

            InventoryService.delete_car(
                car,
            )

            deleted += 1

        return deleted