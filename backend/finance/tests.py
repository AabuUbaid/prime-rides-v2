from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from finance.models import Bank


User = get_user_model()


class FinanceAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.master = User.objects.create_user(
            username="finance_master",
            password="testpass123",
        )

        self.admin = User.objects.create_user(
            username="finance_admin",
            password="testpass123",
        )

        self.sales = User.objects.create_user(
            username="finance_sales",
            password="testpass123",
        )

    def authenticate(self, user):
        self.client.force_authenticate(
            user=user
        )


class BankModelTests(TestCase):

    def test_bank_creation(self):
        bank = Bank.objects.create(
            name="Test Bank",
            interest_rate=Decimal("4.00"),
        )

        self.assertEqual(
            bank.name,
            "Test Bank",
        )

        self.assertEqual(
            bank.interest_rate,
            Decimal("4.00"),
        )

        self.assertFalse(
            bank.is_cash,
        )

        self.assertTrue(
            bank.is_active,
        )

    def test_bank_name_is_unique(self):
        Bank.objects.create(
            name="Unique Bank",
            interest_rate=Decimal("4.00"),
        )

        with self.assertRaises(Exception):
            Bank.objects.create(
                name="Unique Bank",
                interest_rate=Decimal("5.00"),
            ) 