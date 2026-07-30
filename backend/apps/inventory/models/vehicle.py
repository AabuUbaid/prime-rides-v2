from django.core.exceptions import ValidationError
from django.db import models

from apps.common.models import AuditModel

from .generation import Generation
from .lookup import (
    BodyType,
    Color,
    DriveType,
    EngineType,
    FuelType,
    InteriorColor,
    Transmission,
    VehicleStatus,
)
from .variant import Variant
from .vehicle_model import VehicleModel
from apps.inventory.services.stock_number import StockNumberService
from django.utils.text import slugify
from apps.inventory.managers import VehicleManager



class Vehicle(AuditModel):
    # ==========================
    # Identity
    # ==========================

    stock_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
    )

    vin = models.CharField(
        max_length=17,
        unique=True,
    )

    engine_number = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    registration_number = models.CharField(
        max_length=30,
        blank=True,
    )

    # ==========================
    # Vehicle Classification
    # ==========================

    vehicle_model = models.ForeignKey(
        VehicleModel,
        on_delete=models.PROTECT,
        related_name="vehicles",
    )

    generation = models.ForeignKey(
        Generation,
        on_delete=models.PROTECT,
        related_name="vehicles",
    )

    variant = models.ForeignKey(
        Variant,
        on_delete=models.PROTECT,
        related_name="vehicles",
    )

    # ==========================
    # Specifications
    # ==========================

    fuel_type = models.ForeignKey(
        FuelType,
        on_delete=models.PROTECT,
    )

    transmission = models.ForeignKey(
        Transmission,
        on_delete=models.PROTECT,
    )

    drive_type = models.ForeignKey(
        DriveType,
        on_delete=models.PROTECT,
    )

    body_type = models.ForeignKey(
        BodyType,
        on_delete=models.PROTECT,
    )

    engine_type = models.ForeignKey(
        EngineType,
        on_delete=models.PROTECT,
    )

    exterior_color = models.ForeignKey(
        Color,
        on_delete=models.PROTECT,
        related_name="exterior_vehicles",
    )

    interior_color = models.ForeignKey(
        InteriorColor,
        on_delete=models.PROTECT,
        related_name="interior_vehicles",
    )

    status = models.ForeignKey(
        VehicleStatus,
        on_delete=models.PROTECT,
    )

    # ==========================
    # Production
    # ==========================

    manufacturing_year = models.PositiveSmallIntegerField()

    model_year = models.PositiveSmallIntegerField()

    # ==========================
    # Engine
    # ==========================

    engine_capacity_cc = models.PositiveIntegerField()

    horsepower = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    torque_nm = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    # ==========================
    # Cabin
    # ==========================

    doors = models.PositiveSmallIntegerField(
        default=4,
    )

    seats = models.PositiveSmallIntegerField(
        default=5,
    )

    # ==========================
    # Vehicle Condition
    # ==========================

    mileage = models.PositiveIntegerField()

    owner_count = models.PositiveSmallIntegerField(
        default=1,
    )

    service_history = models.BooleanField(
        default=False,
    )

    accident_history = models.BooleanField(
        default=False,
    )

    warranty_available = models.BooleanField(
        default=False,
    )

    imported = models.BooleanField(
        default=False,
    )

    # ==========================
    # Commercial
    # ==========================

    purchase_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    selling_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    minimum_selling_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    purchase_date = models.DateField()

    # ==========================
    # Marketplace
    # ==========================

    featured = models.BooleanField(
        default=False,
    )

    published = models.BooleanField(
        default=False,
    )

    slug = models.SlugField(
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )
    objects = VehicleManager()

    class Meta:
        db_table = "inventory_vehicles"
        ordering = ["-created_at"]

    def clean(self):
        """
        Ensure hierarchy consistency.
        """

        if self.generation.vehicle_model != self.vehicle_model:
            raise ValidationError(
                {
                    "generation": (
                        "Selected generation does not belong "
                        "to the selected vehicle model."
                    )
                }
            )

        if self.variant.generation != self.generation:
            raise ValidationError(
                {
                    "variant": (
                        "Selected variant does not belong "
                        "to the selected generation."
                    )
                }
            )

    def __str__(self):
        return f"{self.stock_number} - {self.vehicle_model.name}"
    
    def save(self, *args, **kwargs):
        if not self.stock_number:
            self.stock_number = StockNumberService.generate()

        if not self.slug:
            self.slug = slugify(
                f"{self.vehicle_model.name}-{self.stock_number}"
            )

        super().save(*args, **kwargs)  

