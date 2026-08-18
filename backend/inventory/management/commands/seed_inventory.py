from collections import Counter

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from inventory.models import Car
from inventory.services import InventoryService


class Command(BaseCommand):
    help = "Create 100 deterministic test vehicles for Inventory testing."

    TEST_PREFIX = "PRX"
    TEST_ENGINE_PREFIX = "ENG"

    STATUSES = [
        "available",
        "upcoming",
        "reserved",
        "sold",
        "in_service",
        "in_house",
    ]

    SOURCES = [
        "own_purchase",
        "auction",
        "park_and_sale",
        "fly_wheel",
        "trade_in",
        "other",
    ]

    SUPPLIERS = [
        "Arabian Automobiles",
        "Al-Futtaim Motors",
        "AGMC",
        "Gargash Motors",
        "Al Nabooda Automobiles",
        "Premier Motors",
        "Al Masaood Automobiles",
        "Elite Cars",
        "Al Tayer Motors",
        "Trading Enterprises",
    ]

    VEHICLE_TEMPLATES = [
        ("Toyota", "Land Cruiser", "GXR"),
        ("Nissan", "Patrol", "Platinum"),
        ("Mercedes-Benz", "C-Class", "Premium"),
        ("BMW", "3 Series", "Limited"),
        ("Lexus", "LX", "Sport"),
        ("Audi", "A4", "Luxury"),
        ("Ford", "Explorer", "Signature"),
        ("Chevrolet", "Tahoe", "SE"),
        ("Kia", "Sportage", "Executive"),
        ("Hyundai", "Tucson", "GT"),
        ("Toyota", "Camry", "GXR"),
        ("Nissan", "X-Trail", "Platinum"),
        ("Mercedes-Benz", "E-Class", "Premium"),
        ("BMW", "5 Series", "Limited"),
        ("Lexus", "ES", "Sport"),
        ("Audi", "A6", "Luxury"),
        ("Ford", "Mustang", "Signature"),
        ("Chevrolet", "Suburban", "SE"),
        ("Kia", "Sorento", "Executive"),
        ("Hyundai", "Santa Fe", "GT"),
    ]

    COLOURS = [
        "White",
        "Black",
        "Silver",
        "Grey",
        "Blue",
        "Red",
        "Beige",
        "Green",
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete previously seeded PRX test vehicles before creating them.",
        )

    def handle(self, *args, **options):

        clear = options["clear"]

        self.stdout.write(
            self.style.WARNING(
                "Prime Rides Inventory Seeder"
            )
        )

        vehicles = self.build_dataset()

        self.stdout.write(
            f"Dataset contains {len(vehicles)} vehicles."
        )

        # ---------------------------------------------------------
        # VALIDATE BEFORE DATABASE CHANGES
        # ---------------------------------------------------------

        self.validate_dataset(vehicles)

        # ---------------------------------------------------------
        # CLEAR PREVIOUS PRX TEST DATA
        # ---------------------------------------------------------

        if clear:
            self.clear_seeded_vehicles()

        existing = Car.objects.filter(
            chassis_number__startswith=self.TEST_PREFIX
        ).count()

        self.stdout.write(
            f"Existing PRX test vehicles: {existing}"
        )

        # ---------------------------------------------------------
        # CREATE VEHICLES
        # ---------------------------------------------------------

        with transaction.atomic():

            created = []

            for vehicle_data in vehicles:

                vehicle_data["stock_id"] = (
                    InventoryService.generate_stock_id()
                )

                car = Car.objects.create(
                    **vehicle_data
                )

                created.append(car)

        # ---------------------------------------------------------
        # REPORT
        # ---------------------------------------------------------

        self.print_report(created)

    # =============================================================
    # DATA GENERATOR
    # =============================================================

    def build_dataset(self):

        vehicles = []

        for index in range(100):

            template_index = index % len(
                self.VEHICLE_TEMPLATES
            )

            make, model, variant = (
                self.VEHICLE_TEMPLATES[
                    template_index
                ]
            )

            status = self.STATUSES[
                index % len(self.STATUSES)
            ]

            source = self.SOURCES[
                index % len(self.SOURCES)
            ]

            supplier = self.SUPPLIERS[
                index % len(self.SUPPLIERS)
            ]

            colour = self.COLOURS[
                index % len(self.COLOURS)
            ]

            year = 2021 + (index % 6)

            purchase_cost = (
                60000
                + (index * 1375)
            )

            asking_price = round(
                purchase_cost * 1.15,
                2,
            )

            least_selling_price = round(
                purchase_cost * 1.08,
                2,
            )

            mileage = (
                5000
                + ((index * 4371) % 140000)
            )

            sequence = index + 1

            chassis_number = (
                f"{self.TEST_PREFIX}"
                f"-CH-{sequence:06d}"
            )

            engine_number = (
                f"{self.TEST_ENGINE_PREFIX}"
                f"-{sequence:06d}"
            )

            vehicle = {
                "make": make,
                "model": model,
                "variant": variant,
                "colour": colour,
                "year": year,
                "purchase_cost": purchase_cost,
                "asking_price": asking_price,
                "least_selling_price": least_selling_price,
                "status": status,
                "mileage": mileage,
                "source": source,
                "source_specify": "",
                "supplier": supplier,
                "highlight_public": (
                    index % 10 == 0
                ),
                "chassis_number": chassis_number,
                "engine_number": engine_number,
            }

            vehicles.append(vehicle)

        return vehicles

    # =============================================================
    # VALIDATION
    # =============================================================

    def validate_dataset(self, vehicles):

        # ---------------------------------------------------------
        # TOTAL
        # ---------------------------------------------------------

        if len(vehicles) != 100:

            raise CommandError(
                f"Expected 100 vehicles, "
                f"found {len(vehicles)}."
            )

        # ---------------------------------------------------------
        # CHASSIS NUMBERS
        # ---------------------------------------------------------

        chassis_numbers = [
            vehicle["chassis_number"]
            for vehicle in vehicles
        ]

        if len(set(chassis_numbers)) != 100:

            raise CommandError(
                "Duplicate chassis numbers detected."
            )

        # ---------------------------------------------------------
        # ENGINE NUMBERS
        # ---------------------------------------------------------

        engine_numbers = [
            vehicle["engine_number"]
            for vehicle in vehicles
        ]

        if len(set(engine_numbers)) != 100:

            raise CommandError(
                "Duplicate engine numbers detected."
            )

        # ---------------------------------------------------------
        # STATUS DISTRIBUTION
        # ---------------------------------------------------------

        statuses = Counter(
            vehicle["status"]
            for vehicle in vehicles
        )

        expected_statuses = {
            status: 100 // len(self.STATUSES)
            for status in self.STATUSES
        }

        # 100 / 6 cannot be exactly equal.
        # First four receive 17, last two receive 16.

        expected_statuses = {
            "available": 17,
            "upcoming": 17,
            "reserved": 17,
            "sold": 17,
            "in_service": 16,
            "in_house": 16,
        }

        if statuses != expected_statuses:

            raise CommandError(
                f"Invalid status distribution: "
                f"{dict(statuses)}"
            )

        # ---------------------------------------------------------
        # SOURCE DISTRIBUTION
        # ---------------------------------------------------------

        sources = Counter(
            vehicle["source"]
            for vehicle in vehicles
        )

        expected_sources = {
            "own_purchase": 17,
            "auction": 17,
            "park_and_sale": 17,
            "fly_wheel": 17,
            "trade_in": 16,
            "other": 16,
        }

        if sources != expected_sources:

            raise CommandError(
                f"Invalid source distribution: "
                f"{dict(sources)}"
            )

        # ---------------------------------------------------------
        # SUPPLIER DISTRIBUTION
        # ---------------------------------------------------------

        suppliers = Counter(
            vehicle["supplier"]
            for vehicle in vehicles
        )

        expected_suppliers = {
            supplier: 10
            for supplier in self.SUPPLIERS
        }

        if suppliers != expected_suppliers:

            raise CommandError(
                f"Invalid supplier distribution: "
                f"{dict(suppliers)}"
            )

        # ---------------------------------------------------------
        # FIELD VALIDATION
        # ---------------------------------------------------------

        for index, vehicle in enumerate(
            vehicles,
            start=1,
        ):

            purchase = vehicle["purchase_cost"]
            asking = vehicle["asking_price"]
            least = vehicle["least_selling_price"]
            mileage = vehicle["mileage"]
            year = vehicle["year"]

            if purchase < 0:

                raise CommandError(
                    f"Vehicle {index}: "
                    "negative purchase cost."
                )

            if asking < 0:

                raise CommandError(
                    f"Vehicle {index}: "
                    "negative asking price."
                )

            if least < 0:

                raise CommandError(
                    f"Vehicle {index}: "
                    "negative least selling price."
                )

            if mileage < 0:

                raise CommandError(
                    f"Vehicle {index}: "
                    "negative mileage."
                )

            if purchase > asking:

                raise CommandError(
                    f"Vehicle {index}: "
                    "purchase cost exceeds asking price."
                )

            if least > asking:

                raise CommandError(
                    f"Vehicle {index}: "
                    "least selling price exceeds asking price."
                )

            if year > 2026:

                raise CommandError(
                    f"Vehicle {index}: "
                    "year exceeds 2026."
                )

        self.stdout.write(
            self.style.SUCCESS(
                "Dataset validation passed."
            )
        )

    # =============================================================
    # CLEAR SEEDED VEHICLES
    # =============================================================

    def clear_seeded_vehicles(self):

        queryset = Car.objects.filter(
            chassis_number__startswith=self.TEST_PREFIX
        )

        count = queryset.count()

        if count == 0:

            self.stdout.write(
                "No existing PRX seeded vehicles found."
            )

            return

        self.stdout.write(
            self.style.WARNING(
                f"Deleting {count} existing "
                f"PRX seeded vehicles..."
            )
        )

        queryset.delete()

        self.stdout.write(
            self.style.SUCCESS(
                "Existing PRX seeded vehicles deleted."
            )
        )

    # =============================================================
    # REPORT
    # =============================================================

    def print_report(self, created):

        status_counts = Counter(
            car.status
            for car in created
        )

        source_counts = Counter(
            car.source
            for car in created
        )

        supplier_counts = Counter(
            car.supplier
            for car in created
        )

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created "
                f"{len(created)} vehicles."
            )
        )

        self.stdout.write("")

        self.stdout.write(
            "Status distribution:"
        )

        for status, count in sorted(
            status_counts.items()
        ):

            self.stdout.write(
                f"  {status}: {count}"
            )

        self.stdout.write("")

        self.stdout.write(
            "Source distribution:"
        )

        for source, count in sorted(
            source_counts.items()
        ):

            self.stdout.write(
                f"  {source}: {count}"
            )

        self.stdout.write("")

        self.stdout.write(
            "Supplier distribution:"
        )

        for supplier, count in sorted(
            supplier_counts.items()
        ):

            self.stdout.write(
                f"  {supplier}: {count}"
            )

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                "Inventory seed completed."
            )
        )