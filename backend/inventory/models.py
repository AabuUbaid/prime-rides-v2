import uuid

from django.db import models


class Car(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        UPCOMING = "upcoming", "Upcoming"
        RESERVED = "reserved", "Reserved"
        SOLD = "sold", "Sold"
        IN_SERVICE = "in_service", "In Service"
        IN_HOUSE = "in_house", "In House"

    class Source(models.TextChoices):
        OWN_PURCHASE = "own_purchase", "Own Purchase"
        FLY_WHEEL="fly_wheel", "Fly Wheel"
        PARK_AND_SALE = "park_and_sale", "Park and Sale"
        AUCTION = "auction", "Auction"
        TRADE_IN = "trade_in", "Trade In"
        OTHER = "other", "Other"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    stock_id = models.CharField(
        max_length=20,
        unique=True,
    )

    year = models.PositiveIntegerField()

    make = models.CharField(
        max_length=100,
    )

    model = models.CharField(
        max_length=100,
    )

    variant = models.CharField(
        max_length=100,
    )

    colour = models.CharField(
        max_length=50,
    )

    chassis_number = models.CharField(
        max_length=100,
        blank=True,
    )

    engine_number = models.CharField(
        max_length=100,
        blank=True,
    )

    purchase_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    asking_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    least_selling_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )

    mileage = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    source = models.CharField(
        max_length=30,
        choices=Source.choices,
        default=Source.OWN_PURCHASE,
    )

    source_specify = models.CharField(
            max_length=255,
            blank=True,
    )


    supplier = models.CharField(
        max_length=255,
        blank=True,
    )

    highlight_public = models.BooleanField(
        default=False,
    )

    possession_certificate = models.FileField(
        upload_to="certificates/",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "cars"
        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["stock_id"]),
            models.Index(fields=["status"]),
            models.Index(fields=["source"]),
            models.Index(fields=["supplier"]),
            models.Index(fields=["make"]),
            models.Index(fields=["model"]),
            models.Index(fields=["year"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.stock_id} - {self.year} {self.make} {self.model}"


class CarExpense(models.Model):
    car = models.ForeignKey(
        Car,
        related_name="expenses",
        on_delete=models.CASCADE,
    )

    description = models.CharField(
        max_length=200,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    class Meta:
        db_table = "car_expenses"

    def __str__(self):
        return f"{self.car.stock_id} - {self.description}"


class CarImage(models.Model):
    car = models.ForeignKey(
        Car,
        related_name="images",
        on_delete=models.CASCADE,
    )

    image = models.ImageField(
        upload_to="car_photos/",
    )

    is_cover = models.BooleanField(
        default=False,
    )

    display_order = models.PositiveIntegerField(
            default=0,
        )

    class Meta:
        db_table = "car_images"
        ordering = ["-is_cover", "id","display_order"]
        

    def __str__(self):
        return f"Image - {self.car.stock_id}"