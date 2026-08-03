from django.contrib import admin

from .models import Car, CarExpense, CarImage


class CarExpenseInline(admin.TabularInline):
    model = CarExpense
    extra = 0


class CarImageInline(admin.TabularInline):
    model = CarImage
    extra = 0


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = (
        "stock_id",
        "year",
        "make",
        "model",
        "status",
        "asking_price",
        "purchase_cost",
        "highlight_public",
        "created_at",
    )

    list_filter = (
        "status",
        "make",
        "year",
        "highlight_public",
    )

    search_fields = (
        "stock_id",
        "make",
        "model",
        "variant",
        "chassis_number",
        "engine_number",
    )

    ordering = ("-created_at",)

    inlines = [
        CarExpenseInline,
        CarImageInline,
    ]


@admin.register(CarExpense)
class CarExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "car",
        "description",
        "amount",
    )

    search_fields = (
        "car__stock_id",
        "description",
    )


@admin.register(CarImage)
class CarImageAdmin(admin.ModelAdmin):
    list_display = (
        "car",
        "is_cover",
    )

    list_filter = (
        "is_cover",
    )