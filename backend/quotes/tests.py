from decimal import Decimal

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from .models import Quote
from .serializers import (
    QuoteCreateSerializer,
    QuoteExpenseSerializer,
)


class QuoteSerializerTests(TestCase):

    def test_stock_quote_requires_car(self):
        serializer = QuoteCreateSerializer(
            data={
                "source": Quote.Source.STOCK,
                "customer_name": "Test Customer",
                "customer_mobile": "0500000000",
                "price": "50000.00",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("car_id", serializer.errors)

    def test_saved_emi_quote_requires_emi_sheet(self):
        serializer = QuoteCreateSerializer(
            data={
                "source": Quote.Source.SAVED_EMI,
                "customer_name": "Test Customer",
                "customer_mobile": "0500000000",
                "price": "50000.00",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("emi_sheet_id", serializer.errors)

    def test_quote_expense_rejects_invalid_estimate_range(self):
        serializer = QuoteExpenseSerializer(
            data={
                "expense_type": "insurance",
                "name": "Insurance",
                "estimated_min": "3000.00",
                "estimated_max": "2000.00",
                "actual_amount": None,
                "applies": True,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("estimated_max", serializer.errors)


from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from finance.models import Bank, EmiSheet
from inventory.models import Car

from .models import Quote, QuoteExpense, QuoteSequence
from .services import (
    create_quote,
    generate_quote_number,
)


User = get_user_model()


class QuoteServiceTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="sales@test.com",
            password="test-password",
        )

        self.car = Car.objects.create(
            stock_id="PR-Q001",
            year=2024,
            make="Toyota",
            model="Yaris",
            variant="Standard",
            colour="White",
            chassis_number="CH-Q001",
            engine_number="ENG-Q001",
            mileage=25000,
            asking_price=Decimal("50000.00"),
        )

    def test_quote_number_generation_is_sequential(self):
        first = generate_quote_number()
        second = generate_quote_number()
        third = generate_quote_number()

        self.assertEqual(first, "LEDGER-001")
        self.assertEqual(second, "LEDGER-002")
        self.assertEqual(third, "LEDGER-003")

        sequence = QuoteSequence.objects.get(
            name="quote",
        )

        self.assertEqual(
            sequence.current_number,
            3,
        )

    def test_create_stock_quote_snapshots_vehicle(self):
        quote = create_quote(
            source=Quote.Source.STOCK,
            customer_name="Stock Customer",
            customer_mobile="0500000000",
            price=Decimal("50000.00"),
            car=self.car,
            salesperson=self.user,
        )

        self.assertEqual(
            quote.source,
            Quote.Source.STOCK,
        )

        self.assertEqual(
            quote.car_id,
            self.car.id,
        )

        self.assertIsNone(
            quote.emi_sheet_id,
        )

        self.assertEqual(
            quote.vehicle_stock_id,
            "PR-Q001",
        )

        self.assertEqual(
            quote.vehicle_make,
            "Toyota",
        )

        self.assertEqual(
            quote.vehicle_model,
            "Yaris",
        )

    def test_stock_quote_preserves_vehicle_snapshot(self):
        quote = create_quote(
            source=Quote.Source.STOCK,
            customer_name="Historical Customer",
            customer_mobile="0500000000",
            price=Decimal("50000.00"),
            car=self.car,
        )

        self.car.model = "Changed Model"
        self.car.asking_price = Decimal("55000.00")
        self.car.chassis_number = "CHANGED"
        self.car.save()

        quote.refresh_from_db()

        self.assertEqual(
            quote.vehicle_model,
            "Yaris",
        )

        self.assertEqual(
            quote.vehicle_chassis_number,
            "CH-Q001",
        )

        self.assertEqual(
            quote.price,
            Decimal("50000.00"),
        )

    def test_saved_emi_quote_snapshots_emi_data(self):
        bank = Bank.objects.create(
            name="Test Bank",
            interest_rate=Decimal("3.50"),
            is_cash=False,
            is_active=True,
        )

        emi = EmiSheet.objects.create(
            emi_number="EMI-Q001",
            customer_name="EMI Customer",
            customer_mobile="0500000000",
            car=None,

            vehicle_stock_id="",
            vehicle_make="BMW",
            vehicle_model="X5",
            vehicle_variant="xDrive",
            vehicle_year=2024,
            vehicle_colour="Black",
            vehicle_mileage=25000,
            vehicle_chassis_number="EMI-CH-001",
            vehicle_engine_number="EMI-ENG-001",

            bank=bank,
            bank_name="Test Bank",
            manual_rate_used=False,
            interest_rate=Decimal("3.50"),

            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            vat_amount=Decimal("0.00"),
            price_after_vat=Decimal("100000.00"),
            down_payment=Decimal("20000.00"),

            finance_amount=Decimal("80000.00"),
            expense_total=Decimal("0.00"),
            emi_principal=Decimal("80000.00"),
            tenure_years=5,

            total_interest=Decimal("14000.00"),
            total_payable=Decimal("94000.00"),
            monthly_emi=Decimal("1566.67"),

            evaluation_name="",
            evaluation_amount=Decimal("0.00"),
            bank_processing_amount=Decimal("0.00"),
            insurance_band_name="",
            insurance_amount=Decimal("0.00"),
            registration_amount=Decimal("0.00"),
            rta_amount=Decimal("0.00"),
            service_package_name="",
            service_package_amount=Decimal("0.00"),
            service_package_selected=False,

            include_other_expenses=False,
            registration_dubai=False,
            driving_license=True,
            insurance_surcharge_amount=Decimal("0.00"),
            banker_application_charge=Decimal("0.00"),
            unit_price_after_down_payment=Decimal("80000.00"),

            status=EmiSheet.Status.ACTIVE,
        )

        quote = create_quote(
            source=Quote.Source.SAVED_EMI,
            customer_name="Should Be Replaced",
            customer_mobile="0000000000",
            price=Decimal("100000.00"),
            emi_sheet=emi,
        )

        self.assertEqual(
            quote.source,
            Quote.Source.SAVED_EMI,
        )

        self.assertEqual(
            quote.emi_sheet_id,
            emi.id,
        )

        self.assertIsNone(
            quote.car_id,
        )

        self.assertEqual(
            quote.customer_name,
            "EMI Customer",
        )

        self.assertEqual(
            quote.customer_mobile,
            "0500000000",
        )

        self.assertEqual(
            quote.vehicle_make,
            "BMW",
        )

        self.assertEqual(
            quote.vehicle_model,
            "X5",
        )

        self.assertEqual(
            quote.emi_interest_rate,
            Decimal("3.50"),
        )

        self.assertEqual(
            quote.emi_finance_amount,
            Decimal("80000.00"),
        )

        self.assertEqual(
            quote.emi_total_interest,
            Decimal("14000.00"),
        )

        self.assertEqual(
            quote.emi_monthly_emi,
            Decimal("1566.67"),
        )

    def test_manual_emi_quote_does_not_require_car(self):
        bank = Bank.objects.create(
            name="Manual EMI Bank",
            interest_rate=Decimal("3.50"),
            is_cash=False,
            is_active=True,
        )

        emi = EmiSheet.objects.create(
            emi_number="EMI-MANUAL-Q001",
            customer_name="Manual Vehicle Customer",
            customer_mobile="0500000000",
            car=None,

            vehicle_stock_id="",
            vehicle_make="BMW",
            vehicle_model="X5",
            vehicle_variant="xDrive40i",
            vehicle_year=2024,
            vehicle_colour="Black",
            vehicle_mileage=25000,
            vehicle_chassis_number="MANUAL-CHASSIS-Q001",
            vehicle_engine_number="MANUAL-ENGINE-Q001",

            bank=bank,
            bank_name="Manual EMI Bank",
            manual_rate_used=False,
            interest_rate=Decimal("3.50"),

            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            vat_amount=Decimal("0.00"),
            price_after_vat=Decimal("100000.00"),
            down_payment=Decimal("20000.00"),

            finance_amount=Decimal("80000.00"),
            expense_total=Decimal("0.00"),
            emi_principal=Decimal("80000.00"),
            tenure_years=5,

            total_interest=Decimal("14000.00"),
            total_payable=Decimal("94000.00"),
            monthly_emi=Decimal("1566.67"),

            status=EmiSheet.Status.ACTIVE,
        )

        quote = create_quote(
            source=Quote.Source.SAVED_EMI,
            customer_name="Manual Vehicle Customer",
            customer_mobile="0500000000",
            price=Decimal("100000.00"),
            emi_sheet=emi,
        )

        self.assertIsNone(
            quote.car_id,
        )

        self.assertEqual(
            quote.vehicle_make,
            "BMW",
        )

        self.assertEqual(
            quote.vehicle_chassis_number,
            "MANUAL-CHASSIS-Q001",
        )

    def test_stock_quote_rejects_emi_sheet(self):
        with self.assertRaises(ValueError):
            create_quote(
                source=Quote.Source.STOCK,
                customer_name="Invalid",
                customer_mobile="0500000000",
                price=Decimal("50000.00"),
                car=self.car,
                emi_sheet=object(),
            )

    def test_saved_emi_quote_rejects_car(self):
        with self.assertRaises(ValueError):
            create_quote(
                source=Quote.Source.SAVED_EMI,
                customer_name="Invalid",
                customer_mobile="0500000000",
                price=Decimal("50000.00"),
                car=self.car,
                emi_sheet=object(),
            )

    def test_quote_expenses_are_created(self):
        quote = create_quote(
            source=Quote.Source.STOCK,
            customer_name="Expense Customer",
            customer_mobile="0500000000",
            price=Decimal("50000.00"),
            car=self.car,
            expenses=[
                {
                    "expense_type": "evaluation",
                    "name": "Evaluation",
                    "description": "Vehicle evaluation",
                    "estimated_min": Decimal("1000.00"),
                    "estimated_max": Decimal("1200.00"),
                    "actual_amount": None,
                    "applies": True,
                },
                {
                    "expense_type": "rta",
                    "name": "RTA Passing",
                    "description": "",
                    "estimated_min": Decimal("170.00"),
                    "estimated_max": Decimal("170.00"),
                    "actual_amount": None,
                    "applies": True,
                },
            ],
        )

        expenses = list(
            QuoteExpense.objects.filter(
                quote=quote,
            ).order_by("id")
        )

        self.assertEqual(
            len(expenses),
            2,
        )

        self.assertEqual(
            expenses[0].expense_type,
            "evaluation",
        )

        self.assertEqual(
            expenses[0].estimated_min,
            Decimal("1000.00"),
        )

        self.assertEqual(
            expenses[1].expense_type,
            "rta",
        )

from decimal import Decimal

from django.test import TestCase

from .models import Quote
from .selectors import get_quote, list_quotes
from .services import create_quote


class QuoteSelectorTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="selector@test.com",
            password="test-password",
        )

        self.car_1 = Car.objects.create(
            stock_id="PR-S001",
            year=2024,
            make="Toyota",
            model="Yaris",
            variant="Standard",
            colour="White",
            chassis_number="SEL-CH-001",
            engine_number="SEL-ENG-001",
            mileage=25000,
            asking_price=Decimal("50000.00"),
        )

        self.car_2 = Car.objects.create(
            stock_id="PR-S002",
            year=2023,
            make="BMW",
            model="X5",
            variant="xDrive",
            colour="Black",
            chassis_number="SEL-CH-002",
            engine_number="SEL-ENG-002",
            mileage=30000,
            asking_price=Decimal("100000.00"),
        )

        self.quote_1 = create_quote(
            source=Quote.Source.STOCK,
            customer_name="Ahmed Ali",
            customer_mobile="0501111111",
            price=Decimal("50000.00"),
            car=self.car_1,
            salesperson=self.user,
        )

        self.quote_2 = create_quote(
            source=Quote.Source.STOCK,
            customer_name="Mohammed Khan",
            customer_mobile="0502222222",
            price=Decimal("100000.00"),
            car=self.car_2,
            salesperson=self.user,
        )

        self.quote_2.status = Quote.Status.BOOKED
        self.quote_2.save(
            update_fields=["status", "updated_at"]
        )

        self.quote_3 = create_quote(
            source=Quote.Source.STOCK,
            customer_name="John Thomas",
            customer_mobile="0503333333",
            price=Decimal("75000.00"),
            car=self.car_1,
            salesperson=self.user,
        )

        self.quote_3.status = Quote.Status.SOLD
        self.quote_3.save(
            update_fields=["status", "updated_at"]
        )

        self.quote_4 = create_quote(
            source=Quote.Source.STOCK,
            customer_name="Cancelled Customer",
            customer_mobile="0504444444",
            price=Decimal("60000.00"),
            car=self.car_1,
            salesperson=self.user,
        )

        self.quote_4.status = Quote.Status.CANCELLED
        self.quote_4.save(
            update_fields=["status", "updated_at"]
        )

    def test_list_quotes_returns_all_quotes(self):
        queryset = list_quotes()

        self.assertEqual(
            queryset.count(),
            4,
        )

    def test_filter_quotes_by_quote_status(self):
        queryset = list_quotes(
            status=Quote.Status.QUOTE,
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_1.id,
        )

    def test_filter_quotes_by_booked_status(self):
        queryset = list_quotes(
            status=Quote.Status.BOOKED,
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_2.id,
        )

    def test_filter_quotes_by_sold_status(self):
        queryset = list_quotes(
            status=Quote.Status.SOLD,
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_3.id,
        )

    def test_filter_quotes_by_cancelled_status(self):
        queryset = list_quotes(
            status=Quote.Status.CANCELLED,
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_4.id,
        )

    def test_all_status_returns_all_quotes(self):
        queryset = list_quotes(
            status="all",
        )

        self.assertEqual(
            queryset.count(),
            4,
        )

    def test_search_by_quote_number(self):
        queryset = list_quotes(
            search=self.quote_1.quote_number,
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_1.id,
        )

    def test_search_by_customer_name(self):
        queryset = list_quotes(
            search="Ahmed",
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_1.id,
        )

    def test_search_by_customer_mobile(self):
        queryset = list_quotes(
            search="0502222222",
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_2.id,
        )

    def test_search_by_stock_id(self):
        queryset = list_quotes(
            search="PR-S002",
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_2.id,
        )

    def test_search_by_vehicle_make(self):
        queryset = list_quotes(
            search="BMW",
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_2.id,
        )

    def test_search_by_vehicle_model(self):
        queryset = list_quotes(
            search="X5",
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_2.id,
        )

    def test_search_by_vehicle_variant(self):
        queryset = list_quotes(
            search="xDrive",
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_2.id,
        )

    def test_search_by_chassis_number(self):
        queryset = list_quotes(
            search="SEL-CH-002",
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_2.id,
        )

    def test_search_by_engine_number(self):
        queryset = list_quotes(
            search="SEL-ENG-002",
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_2.id,
        )

    def test_search_is_case_insensitive(self):
        queryset = list_quotes(
            search="ahmed ali",
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_1.id,
        )

    def test_search_with_no_result_returns_empty_queryset(self):
        queryset = list_quotes(
            search="THIS-DOES-NOT-EXIST",
        )

        self.assertEqual(
            queryset.count(),
            0,
        )

    def test_search_and_status_filter_work_together(self):
        queryset = list_quotes(
            search="Mohammed",
            status=Quote.Status.BOOKED,
        )

        self.assertEqual(
            queryset.count(),
            1,
        )

        self.assertEqual(
            queryset.first().id,
            self.quote_2.id,
        )

    def test_get_quote_returns_expected_quote(self):
        quote = get_quote(
            self.quote_1.id,
        )

        self.assertEqual(
            quote.id,
            self.quote_1.id,
        )

        self.assertEqual(
            quote.quote_number,
            self.quote_1.quote_number,
        )

    def test_get_quote_includes_related_objects(self):
        quote = get_quote(
            self.quote_1.id,
        )

        self.assertEqual(
            quote.car.id,
            self.car_1.id,
        )

        self.assertEqual(
            quote.salesperson.id,
            self.user.id,
        )

    def test_newest_quotes_are_first(self):
        queryset = list_quotes()

        results = list(queryset)

        self.assertEqual(
            results[0].id,
            self.quote_4.id,
        )

        self.assertEqual(
            results[-1].id,
            self.quote_1.id,
        )

from rest_framework.test import APITestCase

from .models import Quote
from .services import create_quote


class QuoteAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="api@test.com",
            password="test-password",
        )

        self.client.force_authenticate(
            user=self.user,
        )

        self.car = Car.objects.create(
            stock_id="API-Q001",
            year=2024,
            make="Toyota",
            model="Corolla",
            variant="GLI",
            colour="White",
            chassis_number="API-CH-001",
            engine_number="API-ENG-001",
            mileage=20000,
            asking_price=Decimal("60000.00"),
        )

        self.quote = create_quote(
            source=Quote.Source.STOCK,
            customer_name="Existing Customer",
            customer_mobile="0501111111",
            price=Decimal("60000.00"),
            car=self.car,
        )

    def test_get_quote_list(self):
        response = self.client.get(
            "/api/quotes/",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertTrue(
            response.data["success"],
        )

        self.assertEqual(
            len(response.data["data"]),
            1,
        )

    def test_get_quote_detail(self):
        response = self.client.get(
            f"/api/quotes/{self.quote.id}/",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertTrue(
            response.data["success"],
        )

        self.assertEqual(
            response.data["data"]["id"],
            self.quote.id,
        )

        self.assertEqual(
            response.data["data"]["quote_number"],
            self.quote.quote_number,
        )

    def test_create_stock_quote(self):
        payload = {
            "source": "stock",
            "car_id": str(self.car.id),
            "customer_name": "API Customer",
            "customer_mobile": "0502222222",
            "price": "65000.00",
            "payment_method": "Cash",
            "deposit_amount": "5000.00",
        }

        response = self.client.post(
            "/api/quotes/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertTrue(
            response.data["success"],
        )

        self.assertEqual(
            response.data["message"],
            "Quote created successfully.",
        )

        quote_id = response.data["data"]["id"]

        created_quote = Quote.objects.get(
            id=quote_id,
        )

        self.assertEqual(
            created_quote.customer_name,
            "API Customer",
        )

        self.assertEqual(
            created_quote.price,
            Decimal("65000.00"),
        )

        self.assertEqual(
            created_quote.source,
            Quote.Source.STOCK,
        )

    def test_create_stock_quote_rejects_missing_car(self):
        payload = {
            "source": "stock",
            "customer_name": "Invalid Customer",
            "customer_mobile": "0503333333",
            "price": "50000.00",
        }

        response = self.client.post(
            "/api/quotes/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertFalse(
            response.data["success"],
        )

    def test_create_saved_emi_quote_requires_emi_sheet(
        self,
    ):
        payload = {
            "source": "saved_emi",
            "customer_name": "Invalid EMI Customer",
            "customer_mobile": "0504444444",
            "price": "50000.00",
        }

        response = self.client.post(
            "/api/quotes/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertFalse(
            response.data["success"],
        )

    def test_quote_list_supports_search(self):
        response = self.client.get(
            "/api/quotes/?search=Existing",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(response.data["data"]),
            1,
        )

    def test_quote_list_supports_status_filter(self):
        response = self.client.get(
            f"/api/quotes/?status={Quote.Status.QUOTE}",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(response.data["data"]),
            1,
        )

    def test_quote_list_requires_authentication(self):
        self.client.force_authenticate(
            user=None,
        )

        response = self.client.get(
            "/api/quotes/",
        )

        self.assertEqual(
            response.status_code,
            401,
        )

class QuoteUpdateDeleteAPITests(APITestCase):

    def setUp(self):
        self.master = User.objects.create_user(
            email="master-quote@test.com",
            password="test-password",
            role="MASTER",
        )

        self.admin = User.objects.create_user(
            email="admin-quote@test.com",
            password="test-password",
            role="ADMIN",
        )

        self.sales = User.objects.create_user(
            email="sales-quote@test.com",
            password="test-password",
            role="SALES_STAFF",
        )

        self.car = Car.objects.create(
            stock_id="UPDATE-Q001",
            year=2024,
            make="Toyota",
            model="Camry",
            variant="GCC",
            colour="White",
            chassis_number="UPDATE-CH-001",
            engine_number="UPDATE-ENG-001",
            mileage=20000,
            asking_price=Decimal("70000.00"),
        )

        self.quote = create_quote(
            source=Quote.Source.STOCK,
            customer_name="Update Customer",
            customer_mobile="0501111111",
            price=Decimal("70000.00"),
            payment_method="Cash",
            deposit_amount=Decimal("5000.00"),
            car=self.car,
            salesperson=self.sales,
        )

    def test_patch_salesperson(self):
        self.client.force_authenticate(
            user=self.master,
        )

        response = self.client.patch(
            f"/api/quotes/{self.quote.id}/",
            {
                "salesperson_id": str(self.master.id),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.quote.refresh_from_db()

        self.assertEqual(
            self.quote.salesperson_id,
            self.master.id,
        )

    def test_patch_deposit(self):
        self.client.force_authenticate(
            user=self.master,
        )

        response = self.client.patch(
            f"/api/quotes/{self.quote.id}/",
            {
                "deposit_amount": "10000.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.quote.refresh_from_db()

        self.assertEqual(
            self.quote.deposit_amount,
            Decimal("10000.00"),
        )

    def test_patch_deposit_date(self):
        self.client.force_authenticate(
            user=self.master,
        )

        response = self.client.patch(
            f"/api/quotes/{self.quote.id}/",
            {
                "deposit_date": "2026-08-31",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.quote.refresh_from_db()

        self.assertEqual(
            str(self.quote.deposit_date),
            "2026-08-31",
        )

    def test_patch_status(self):
        self.client.force_authenticate(
            user=self.master,
        )

        response = self.client.patch(
            f"/api/quotes/{self.quote.id}/",
            {
                "status": Quote.Status.BOOKED,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.quote.refresh_from_db()

        self.assertEqual(
            self.quote.status,
            Quote.Status.BOOKED,
        )

    def test_protected_quote_number_cannot_be_updated(self):
        self.client.force_authenticate(
            user=self.master,
        )

        original_number = self.quote.quote_number

        response = self.client.patch(
            f"/api/quotes/{self.quote.id}/",
            {
                "quote_number": "FAKE-999",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.quote.refresh_from_db()

        self.assertEqual(
            self.quote.quote_number,
            original_number,
        )

    def test_protected_source_cannot_be_updated(self):
        self.client.force_authenticate(
            user=self.master,
        )

        response = self.client.patch(
            f"/api/quotes/{self.quote.id}/",
            {
                "source": Quote.Source.SAVED_EMI,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.quote.refresh_from_db()

        self.assertEqual(
            self.quote.source,
            Quote.Source.STOCK,
        )

    def test_protected_vehicle_snapshot_cannot_be_updated(self):
        self.client.force_authenticate(
            user=self.master,
        )

        original_model = self.quote.vehicle_model

        response = self.client.patch(
            f"/api/quotes/{self.quote.id}/",
            {
                "vehicle_model": "FAKE MODEL",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.quote.refresh_from_db()

        self.assertEqual(
            self.quote.vehicle_model,
            original_model,
        )

    def test_protected_price_cannot_be_updated(self):
        self.client.force_authenticate(
            user=self.master,
        )

        original_price = self.quote.price

        response = self.client.patch(
            f"/api/quotes/{self.quote.id}/",
            {
                "price": "999999.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.quote.refresh_from_db()

        self.assertEqual(
            self.quote.price,
            original_price,
        )

    def test_master_can_delete_quote(self):
        self.client.force_authenticate(
            user=self.master,
        )

        quote_id = self.quote.id

        response = self.client.delete(
            f"/api/quotes/{quote_id}/",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertFalse(
            Quote.objects.filter(
                id=quote_id,
            ).exists(),
        )

    def test_admin_cannot_delete_quote(self):
        self.client.force_authenticate(
            user=self.admin,
        )

        quote_id = self.quote.id

        response = self.client.delete(
            f"/api/quotes/{quote_id}/",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertTrue(
            Quote.objects.filter(
                id=quote_id,
            ).exists(),
        )

    def test_sales_cannot_delete_quote(self):
        self.client.force_authenticate(
            user=self.sales,
        )

        quote_id = self.quote.id

        response = self.client.delete(
            f"/api/quotes/{quote_id}/",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertTrue(
            Quote.objects.filter(
                id=quote_id,
            ).exists(),
        )

    def test_missing_quote_returns_404(self):
        self.client.force_authenticate(
            user=self.master,
        )

        response = self.client.get(
            "/api/quotes/999999/",
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_patch_cannot_change_historical_emi_fields(self):
        self.client.force_authenticate(
            user=self.master,
        )

        response = self.client.patch(
            f"/api/quotes/{self.quote.id}/",
            {
                "emi_interest_rate": "99.00",
                "emi_finance_amount": "1.00",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.quote.refresh_from_db()

        self.assertIsNone(
            self.quote.emi_interest_rate,
        )

        self.assertIsNone(
            self.quote.emi_finance_amount,
        )