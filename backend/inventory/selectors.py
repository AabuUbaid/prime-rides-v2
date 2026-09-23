from .models import (Car, CarImage, CarExpense,)
from django.shortcuts import get_object_or_404
from django.db.models import (
    Max,
    Count,
    Sum,
    Avg,
    Q,
    F,
)

from django.db.models import (
    Sum,
    Avg,
    Count,
)
from django.db.models import Sum
from datetime import timedelta
from django.utils import timezone


class InventorySelector:

    @staticmethod
    def list_cars(
        *,
        search=None,
        status=None,
        source=None,
        make=None,
        supplier=None,
        year=None,
        age=None,
        aged_90_plus=None,
        highlight_public=None,
        min_price=None,
        max_price=None,
        min_mileage=None,
        max_mileage=None,
        vehicle_type=None,
        ordering="-created_at",
    ):

        queryset = (
            Car.objects
            .prefetch_related(
                "images",
                "expenses",
            )
        )

        if search:

            queryset = queryset.filter(
                Q(stock_id__icontains=search) |
                Q(make__icontains=search) |
                Q(model__icontains=search) |
                Q(variant__icontains=search) |
                Q(supplier__icontains=search) |
                Q(chassis_number__icontains=search) |
                Q(engine_number__icontains=search)
            )
            
        age = age
        aged_90_plus = aged_90_plus

        if age is not None:
            cutoff_date = timezone.localdate() - timedelta(days=age)

            queryset = queryset.filter(
                created_at__date__lte=cutoff_date
            )

        if aged_90_plus is True:
            cutoff_date = timezone.localdate() - timedelta(days=90)

            queryset = queryset.filter(
                created_at__date__lte=cutoff_date
            )

        if status:

            queryset = queryset.filter(
                status=status,
            )

        if make:
            
            queryset = queryset.filter(
                make__iexact=make,
            )
                
        if vehicle_type:

            queryset = queryset.filter(
                vehicle_type__iexact=vehicle_type,
            )

        if source:

            queryset = queryset.filter(
                source=source,
            )

        if supplier:

            queryset = queryset.filter(
                supplier__icontains=supplier,
            )

        if year:

            queryset = queryset.filter(
                year=year,
            )

        if highlight_public is not None:

            highlight = (
                str(highlight_public).lower() == "true"
            )

            queryset = queryset.filter(
                highlight_public=highlight,
            )

        if min_price:

            queryset = queryset.filter(
                asking_price__gte=min_price,
            )

        if max_price:

            queryset = queryset.filter(
                asking_price__lte=max_price,
            )

        if min_mileage:

            queryset = queryset.filter(
                mileage__gte=min_mileage,
            )

        if max_mileage:

            queryset = queryset.filter(
                mileage__lte=max_mileage,
            )

        return queryset.order_by(ordering)

    @staticmethod
    def get_expense_by_id(expense_id):
        return get_object_or_404(
            CarExpense,
           id=expense_id,
        )

    @staticmethod
    def get_car_by_id(car_id):
        return get_object_or_404(
            Car.objects.prefetch_related(
                "images",
                "expenses",
            ),
            id=car_id,
        )

    # @staticmethod
    # def get_car_images(car):
    #     return (
    #         CarImage.objects
    #         .filter(car=car)
    #         .order_by("-is_cover", "id")
    #     )

    @staticmethod
    def get_image_by_id(image_id):
        return get_object_or_404(
            CarImage,
            id=image_id,
        )


    @staticmethod
    def dashboard_summary():

        vehicle_stats = Car.objects.aggregate(

            total_vehicles=Count("id"),

            available=Count(
                "id",
                filter=Q(status=Car.Status.AVAILABLE),
            ),

            reserved=Count(
                "id",
                filter=Q(status=Car.Status.RESERVED),
            ),

            sold=Count(
                "id",
                filter=Q(status=Car.Status.SOLD),
            ),

            upcoming=Count(
                "id",
                filter=Q(status=Car.Status.UPCOMING),
            ),

            in_house=Count(
                "id",
                filter=Q(status=Car.Status.IN_HOUSE),
            ),

            in_service=Count(
                "id",
                filter=Q(status=Car.Status.IN_SERVICE),
            ),

            highlighted_vehicles=Count(
                "id",
                filter=Q(highlight_public=True),
            ),

            inventory_value=Sum("asking_price"),

            average_purchase_cost=Avg(
                "purchase_cost",
            ),

            average_asking_price=Avg(
                "asking_price",
            ),
        )

        expense_stats = CarExpense.objects.aggregate(

            total_expenses=Sum(
                "amount",
            ),
        )

        return {

            **vehicle_stats,

            "inventory_value":
                vehicle_stats["inventory_value"] or 0,

            "average_purchase_cost":
                vehicle_stats["average_purchase_cost"] or 0,

            "average_asking_price":
                vehicle_stats["average_asking_price"] or 0,

            "total_expenses":
                expense_stats["total_expenses"] or 0,
        }

    @staticmethod
    def get_expense_summary(car):

        total_expenses = (
            car.expenses.aggregate(
                total=Sum("amount"),
            )["total"]
            or 0
        )

        purchase_cost = car.purchase_cost or 0

        return {
            "expense_count": car.expenses.count(),
            "total_expenses": total_expenses,
            "net_cost": purchase_cost + total_expenses,
        }

    @staticmethod
    def get_car_images(car):

        return (
            CarImage.objects
            .filter(
                car=car,
            )
            .order_by(
                "display_order",
                "id",
            )
        )

    @staticmethod
    def get_images_by_ids(image_ids):

        return (
            CarImage.objects
            .filter(
                id__in=image_ids,
            )
        )
    
    @staticmethod
    def get_cars_by_ids(vehicle_ids):

        return (
            Car.objects.filter(
                id__in=vehicle_ids,
            )
        )