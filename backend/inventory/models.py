import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
class Car(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        UPCOMING = "upcoming", "Upcoming"
        RESERVED = "reserved", "Reserved"
        BOOKED="booked", "Booked"
        SOLD = "sold", "Sold"
        IN_SERVICE = "in_service", "In Service"
        IN_HOUSE = "in_house", "In House"

    class VehicleType(models.TextChoices):
        SEDAN = "sedan", "Sedan"
        SUV = "suv", "SUV (Sport Utility Vehicle)"
        HATCHBACK = "hatchback", "Hatchback"
        CROSSOVER = "crossover", "Crossover"
        COUPE = "coupe", "Coupe"
        CONVERTIBLE = "convertible", "Convertible"
        PICKUP_TRUCK = "pickup_truck", "Pickup Truck"
        OTHER = "other", "Other"

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
    
    vehicle_type = models.CharField(
        max_length=100,
        choices=VehicleType.choices,
        blank=True,
    )

    year = models.PositiveIntegerField(
    )

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
    
    actual_mileage = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    mileage = models.PositiveIntegerField(
        null=True,
        blank=True,
    )
    
    service_location = models.CharField(
        max_length=255,
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
        ordering = ["-is_cover","display_order", "id"]
        

    def __str__(self):
        return f"Image - {self.car.stock_id}"
    
    
    
class SpecialPriceRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        DECLINED = "declined", "Declined"
        EXPIRED = "expired", "Expired"
        USED = "used", "Used"

    car = models.ForeignKey(
        Car,
        on_delete=models.PROTECT,
        related_name="special_price_requests",
    )

    # Transaction context.
    #
    # These remain nullable because an enquiry can be created before
    # the final Quote/EMI record exists. Stage 3B will bind the
    # approved request to the relevant Quote/EMI transaction.
    quote = models.ForeignKey(
        "quotes.Quote",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="special_price_requests",
    )

    emi_sheet = models.ForeignKey(
        "finance.EmiSheet",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="special_price_requests",
    )

    requested_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
        ],
    )

    # Historical Inventory pricing snapshot at enquiry time.
    inventory_asked_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
        ],
    )

    inventory_vehicle_expenses = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[
            MinValueValidator(0),
        ],
    )

    least_selling_price_at_request = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
        ],
    )

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="special_price_requests_created",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    approved_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
        ],
    )

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="special_price_requests_approved",
    )

    approved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    declined_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    used_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    used_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="special_price_requests_used",
    )

    decision_note = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "inventory_special_price_requests"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["car", "status"],
            ),
            models.Index(
                fields=["quote"],
            ),
            models.Index(
                fields=["emi_sheet"],
            ),
            models.Index(
                fields=["requested_by"],
            ),
            models.Index(
                fields=["status"],
            ),
            models.Index(
                fields=["expires_at"],
            ),
            models.Index(
                fields=["created_at"],
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["car"],
                condition=models.Q(status="pending"),
                name="unique_pending_special_price_per_car",
            ),
        ]

    def __str__(self):
        return (
            f"Special Price Request - "
            f"{self.car.stock_id} - "
            f"{self.requested_price} - "
            f"{self.status}"
        )