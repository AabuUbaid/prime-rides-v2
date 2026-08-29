from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models.deletion import ProtectedError
from django.test import TestCase
from rest_framework.test import APIClient

from finance.models import (
    Bank,
    BankProcessingConfiguration,
    EmiExpense,
    EmiSequence,
    EmiSheet,
    ExpensePreset,
    InsuranceBand,
    ServicePackage,
)

from finance.services import (
    calculate_emi,
    create_emi_sheet,
    _resolve_master_expenses,
)


User = get_user_model()


# =========================================================
# API TEST BASE
# =========================================================


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


# =========================================================
# BANK MODEL TESTS
# =========================================================


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


# =========================================================
# COMMON FINANCE TEST HELPERS
# =========================================================


class FinanceTestMixin:

    def create_bank(self):

        return Bank.objects.create(
            name="Test Finance Bank",
            interest_rate=Decimal("0.00"),
            is_cash=True,
            is_active=True,
        )

    def create_emi_sequence(self):

        return EmiSequence.objects.create(
            name="emi",
            current_number=0,
        )

    def create_master_configuration(self, bank):

        self.evaluation = ExpensePreset.objects.create(
            name="Standard Evaluation",
            expense_type="evaluation",
            amount=Decimal("150.00"),
            is_active=True,
        )

        self.insurance = InsuranceBand.objects.create(
            name="Vehicle 100K-150K",
            minimum_vehicle_price=Decimal(
                "100000.00"
            ),
            maximum_vehicle_price=Decimal(
                "150000.00"
            ),
            amount=Decimal("2500.00"),
            is_active=True,
        )

        self.service_package = ServicePackage.objects.create(
            name="Premium Service",
            description="Premium service package",
            amount=Decimal("3000.00"),
            is_active=True,
        )

        self.bank_processing = (
            BankProcessingConfiguration.objects.create(
                bank=bank,
                percentage=Decimal("1.25"),
                minimum_amount=Decimal("540.00"),
                is_active=True,
            )
        )

    def manual_vehicle(self, suffix="001"):

        return {
            "make": "Test",
            "model": "Test Model",
            "variant": "Test Variant",
            "year": 2025,
            "colour": "Black",
            "mileage": 10000,
            "chassis_number": (
                f"TEST-CHASSIS-{suffix}"
            ),
            "engine_number": (
                f"TEST-ENGINE-{suffix}"
            ),
        }


# =========================================================
# EMI TENURE TESTS
# =========================================================


class EmiTenureTests(
    FinanceTestMixin,
    TestCase,
):

    def setUp(self):

        self.bank = self.create_bank()

    def test_tenure_5_is_allowed(self):

        result = calculate_emi(
            vehicle_price=Decimal("100000.00"),
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            vat_enabled=False,
            expenses=[],
        )

        self.assertEqual(
            result["tenure_years"],
            5,
        )

    def test_tenure_above_5_is_rejected(self):

        with self.assertRaises(
            ValidationError
        ):

            calculate_emi(
                vehicle_price=Decimal("100000.00"),
                down_payment=Decimal("20000.00"),
                tenure_years=6,
                bank_id=self.bank.id,
                vat_enabled=False,
                expenses=[],
            )

    def test_tenure_zero_is_rejected(self):

        with self.assertRaises(
            ValidationError
        ):

            calculate_emi(
                vehicle_price=Decimal("100000.00"),
                down_payment=Decimal("20000.00"),
                tenure_years=0,
                bank_id=self.bank.id,
                vat_enabled=False,
                expenses=[],
            )

    def test_negative_tenure_is_rejected(self):

        with self.assertRaises(
            ValidationError
        ):

            calculate_emi(
                vehicle_price=Decimal("100000.00"),
                down_payment=Decimal("20000.00"),
                tenure_years=-1,
                bank_id=self.bank.id,
                vat_enabled=False,
                expenses=[],
            )


# =========================================================
# MASTER EXPENSE RESOLUTION TESTS
# =========================================================


class MasterExpenseResolutionTests(
    FinanceTestMixin,
    TestCase,
):

    def setUp(self):

        self.bank = self.create_bank()

        self.create_master_configuration(
            self.bank
        )

    # -----------------------------------------------------
    # Evaluation
    # -----------------------------------------------------

    def test_evaluation_uses_master_amount(self):

        resolved = _resolve_master_expenses(
            vehicle_price=Decimal("100000.00"),
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "evaluation",
                    "amount": Decimal("99999.00"),
                }
            ],
        )

        self.assertEqual(
            len(resolved),
            1,
        )

        self.assertEqual(
            resolved[0]["amount"],
            Decimal("150.00"),
        )

        self.assertEqual(
            resolved[0]["name"],
            "Standard Evaluation",
        )

    # -----------------------------------------------------
    # Evaluation name
    # -----------------------------------------------------

    def test_evaluation_name_comes_from_master(self):

        resolved = _resolve_master_expenses(
            vehicle_price=Decimal("100000.00"),
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "evaluation",
                    "name": "Customer Evaluation",
                    "amount": Decimal("99999.00"),
                }
            ],
        )

        self.assertEqual(
            resolved[0]["name"],
            "Standard Evaluation",
        )

    # -----------------------------------------------------
    # Insurance
    # -----------------------------------------------------

    def test_insurance_uses_master_amount(self):

        resolved = _resolve_master_expenses(
            vehicle_price=Decimal("100000.00"),
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "insurance",
                    "amount": Decimal("99999.00"),
                }
            ],
        )

        self.assertEqual(
            resolved[0]["amount"],
            Decimal("2500.00"),
        )

        self.assertEqual(
            resolved[0]["name"],
            "Vehicle 100K-150K",
        )

    # -----------------------------------------------------
    # Bank processing
    # -----------------------------------------------------

    def test_bank_processing_uses_master_percentage(self):

        resolved = _resolve_master_expenses(
            vehicle_price=Decimal("100000.00"),
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "bank_process",
                    "amount": Decimal("1.00"),
                }
            ],
        )

        self.assertEqual(
            resolved[0]["amount"],
            Decimal("1250.00"),
        )

    # -----------------------------------------------------
    # Bank processing minimum
    # -----------------------------------------------------

    def test_bank_processing_minimum_is_used(self):

        self.bank_processing.percentage = (
            Decimal("0.10")
        )

        self.bank_processing.save()

        resolved = _resolve_master_expenses(
            vehicle_price=Decimal("100000.00"),
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "bank_process",
                    "amount": Decimal("1.00"),
                }
            ],
        )

        self.assertEqual(
            resolved[0]["amount"],
            Decimal("540.00"),
        )

    # -----------------------------------------------------
    # Service package
    # -----------------------------------------------------

    def test_service_package_uses_master_amount(self):

        resolved = _resolve_master_expenses(
            vehicle_price=Decimal("100000.00"),
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "service_package",
                    "service_package_id": (
                        self.service_package.id
                    ),
                    "amount": Decimal("99999.00"),
                }
            ],
        )

        self.assertEqual(
            resolved[0]["amount"],
            Decimal("3000.00"),
        )

        self.assertEqual(
            resolved[0]["name"],
            "Premium Service",
        )

    # -----------------------------------------------------
    # Missing service package
    # -----------------------------------------------------

    def test_service_package_requires_id(self):

        with self.assertRaises(
            ValidationError
        ):

            _resolve_master_expenses(
                vehicle_price=Decimal("100000.00"),
                bank_id=self.bank.id,
                expenses=[
                    {
                        "expense_type": "service_package",
                    }
                ],
            )

    # -----------------------------------------------------
    # Unsupported expense
    # -----------------------------------------------------

    def test_unsupported_expense_type_is_rejected(self):

        with self.assertRaises(
            ValidationError
        ):

            _resolve_master_expenses(
                vehicle_price=Decimal("100000.00"),
                bank_id=self.bank.id,
                expenses=[
                    {
                        "expense_type": "unknown_expense",
                        "amount": Decimal("100.00"),
                    }
                ],
            )

    # -----------------------------------------------------
    # Missing expense type
    # -----------------------------------------------------

    def test_missing_expense_type_is_rejected(self):

        with self.assertRaises(
            ValidationError
        ):

            _resolve_master_expenses(
                vehicle_price=Decimal("100000.00"),
                bank_id=self.bank.id,
                expenses=[
                    {
                        "amount": Decimal("100.00"),
                    }
                ],
            )


# =========================================================
# MASTER EXPENSE + EMI TESTS
# =========================================================


class MasterExpenseTests(
    FinanceTestMixin,
    TestCase,
):

    def setUp(self):

        self.bank = self.create_bank()

        self.create_master_configuration(
            self.bank
        )

        self.create_emi_sequence()

    # -----------------------------------------------------
    # Evaluation
    # -----------------------------------------------------

    def test_evaluation_uses_master_amount(self):

        sheet = create_emi_sheet(
            customer_name="Master Evaluation Test",
            customer_mobile="0500000001",
            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "evaluation",
                    "amount": Decimal("99999.00"),
                }
            ],
            manual_vehicle=self.manual_vehicle(
                "EVALUATION-001"
            ),
        )

        expense = sheet.expenses.get(
            expense_type="evaluation"
        )

        self.assertEqual(
            expense.amount,
            Decimal("150.00"),
        )

        self.assertEqual(
            expense.name,
            "Standard Evaluation",
        )

        self.assertEqual(
            sheet.expense_total,
            Decimal("150.00"),
        )

        self.assertEqual(
            sheet.finance_amount,
            Decimal("80150.00"),
        )

    # -----------------------------------------------------
    # Insurance
    # -----------------------------------------------------

    def test_insurance_uses_master_amount(self):

        sheet = create_emi_sheet(
            customer_name="Master Insurance Test",
            customer_mobile="0500000002",
            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "insurance",
                    "amount": Decimal("99999.00"),
                }
            ],
            manual_vehicle=self.manual_vehicle(
                "INSURANCE-001"
            ),
        )

        expense = sheet.expenses.get(
            expense_type="insurance"
        )

        self.assertEqual(
            expense.amount,
            Decimal("2500.00"),
        )

        self.assertEqual(
            sheet.expense_total,
            Decimal("2500.00"),
        )

        self.assertEqual(
            sheet.finance_amount,
            Decimal("82500.00"),
        )

    # -----------------------------------------------------
    # Bank processing percentage
    # -----------------------------------------------------

    def test_bank_processing_uses_master_percentage(
        self,
    ):

        sheet = create_emi_sheet(
            customer_name="Master Bank Processing Test",
            customer_mobile="0500000003",
            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "bank_process",
                    "amount": Decimal("1.00"),
                }
            ],
            manual_vehicle=self.manual_vehicle(
                "BANK-PROCESS-001"
            ),
        )

        expense = sheet.expenses.get(
            expense_type="bank_process"
        )

        self.assertEqual(
            expense.amount,
            Decimal("1250.00"),
        )

        self.assertEqual(
            sheet.expense_total,
            Decimal("1250.00"),
        )

        self.assertEqual(
            sheet.finance_amount,
            Decimal("81250.00"),
        )

    # -----------------------------------------------------
    # Bank processing minimum
    # -----------------------------------------------------

    def test_bank_processing_minimum_is_used(
        self,
    ):

        self.bank_processing.percentage = (
            Decimal("0.10")
        )

        self.bank_processing.save()

        sheet = create_emi_sheet(
            customer_name="Bank Processing Minimum Test",
            customer_mobile="0500000004",
            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "bank_process",
                    "amount": Decimal("1.00"),
                }
            ],
            manual_vehicle=self.manual_vehicle(
                "BANK-MINIMUM-001"
            ),
        )

        expense = sheet.expenses.get(
            expense_type="bank_process"
        )

        self.assertEqual(
            expense.amount,
            Decimal("540.00"),
        )

        self.assertEqual(
            sheet.expense_total,
            Decimal("540.00"),
        )

        self.assertEqual(
            sheet.finance_amount,
            Decimal("80540.00"),
        )

    # -----------------------------------------------------
    # Service package
    # -----------------------------------------------------

    def test_service_package_uses_master_amount(
        self,
    ):

        sheet = create_emi_sheet(
            customer_name="Master Service Package Test",
            customer_mobile="0500000005",
            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "service_package",
                    "service_package_id": (
                        self.service_package.id
                    ),
                    "amount": Decimal("99999.00"),
                }
            ],
            manual_vehicle=self.manual_vehicle(
                "SERVICE-001"
            ),
        )

        expense = sheet.expenses.get(
            expense_type="service_package"
        )

        self.assertEqual(
            expense.amount,
            Decimal("3000.00"),
        )

        self.assertEqual(
            sheet.expense_total,
            Decimal("3000.00"),
        )

        self.assertEqual(
            sheet.finance_amount,
            Decimal("83000.00"),
        )


# =========================================================
# EMI CALCULATION TESTS
# =========================================================


class EmiExpenseCalculationTests(
    FinanceTestMixin,
    TestCase,
):

    def setUp(self):

        self.bank = self.create_bank()

    # -----------------------------------------------------
    # No expenses
    # -----------------------------------------------------

    def test_no_expenses(self):

        result = calculate_emi(
            vehicle_price=Decimal("100000.00"),
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            vat_enabled=False,
            expenses=[],
        )

        self.assertEqual(
            result["expense_total"],
            Decimal("0.00"),
        )

        self.assertEqual(
            result["emi_principal"],
            Decimal("80000.00"),
        )

        self.assertEqual(
            result["finance_amount"],
            Decimal("80000.00"),
        )

        self.assertEqual(
            result["monthly_emi"],
            Decimal("1333.33"),
        )

    # -----------------------------------------------------
    # Single expense
    # -----------------------------------------------------

    def test_expense_is_added_to_finance_amount(
        self,
    ):

        result = calculate_emi(
            vehicle_price=Decimal("100000.00"),
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            vat_enabled=False,
            expenses=[
                {
                    "expense_type": "custom",
                    "amount": Decimal("3650.00"),
                }
            ],
        )

        self.assertEqual(
            result["expense_total"],
            Decimal("3650.00"),
        )

        self.assertEqual(
            result["emi_principal"],
            Decimal("83650.00"),
        )

        self.assertEqual(
            result["finance_amount"],
            Decimal("83650.00"),
        )

        self.assertEqual(
            result["monthly_emi"],
            Decimal("1394.17"),
        )

    # -----------------------------------------------------
    # Multiple expenses
    # -----------------------------------------------------

    def test_multiple_expenses_are_added(self):

        result = calculate_emi(
            vehicle_price=Decimal("100000.00"),
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            vat_enabled=False,
            expenses=[
                {
                    "expense_type": "custom_one",
                    "amount": Decimal("1000.00"),
                },
                {
                    "expense_type": "custom_two",
                    "amount": Decimal("2500.00"),
                },
                {
                    "expense_type": "custom_three",
                    "amount": Decimal("150.00"),
                },
            ],
        )

        self.assertEqual(
            result["expense_total"],
            Decimal("3650.00"),
        )

        self.assertEqual(
            result["emi_principal"],
            Decimal("83650.00"),
        )

        self.assertEqual(
            result["finance_amount"],
            Decimal("83650.00"),
        )

        self.assertEqual(
            result["monthly_emi"],
            Decimal("1394.17"),
        )

    # -----------------------------------------------------
    # Negative expense
    # -----------------------------------------------------

    def test_negative_expense_is_rejected(self):

        with self.assertRaises(
            ValidationError
        ):

            calculate_emi(
                vehicle_price=Decimal("100000.00"),
                down_payment=Decimal("20000.00"),
                tenure_years=5,
                bank_id=self.bank.id,
                vat_enabled=False,
                expenses=[
                    {
                        "expense_type": "custom",
                        "amount": Decimal("-100.00"),
                    }
                ],
            )


# =========================================================
# EMI SNAPSHOT TESTS
# =========================================================


class EmiSnapshotTests(
    FinanceTestMixin,
    TestCase,
):

    def setUp(self):

        self.bank = self.create_bank()

        self.create_master_configuration(
            self.bank
        )

        self.create_emi_sequence()

    # -----------------------------------------------------
    # Snapshot persistence
    # -----------------------------------------------------

    def test_saved_emi_contains_resolved_expense_snapshots(
        self,
    ):

        sheet = create_emi_sheet(
            customer_name="Snapshot Test",
            customer_mobile="0500000006",
            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "evaluation",
                    "amount": Decimal("99999.00"),
                },
                {
                    "expense_type": "insurance",
                    "amount": Decimal("99999.00"),
                },
                {
                    "expense_type": "bank_process",
                    "amount": Decimal("99999.00"),
                },
                {
                    "expense_type": "service_package",
                    "service_package_id": (
                        self.service_package.id
                    ),
                    "amount": Decimal("99999.00"),
                },
            ],
            manual_vehicle=self.manual_vehicle(
                "SNAPSHOT-001"
            ),
        )

        expenses = list(
            sheet.expenses.order_by(
                "expense_type"
            )
        )

        self.assertEqual(
            len(expenses),
            4,
        )

        amounts = {
            expense.expense_type:
            expense.amount
            for expense in expenses
        }

        names = {
            expense.expense_type:
            expense.name
            for expense in expenses
        }

        self.assertEqual(
            amounts["evaluation"],
            Decimal("150.00"),
        )

        self.assertEqual(
            amounts["insurance"],
            Decimal("2500.00"),
        )

        self.assertEqual(
            amounts["bank_process"],
            Decimal("1250.00"),
        )

        self.assertEqual(
            amounts["service_package"],
            Decimal("3000.00"),
        )

        self.assertEqual(
            names["evaluation"],
            "Standard Evaluation",
        )

        self.assertEqual(
            names["insurance"],
            "Vehicle 100K-150K",
        )

        self.assertEqual(
            names["service_package"],
            "Premium Service",
        )

        self.assertEqual(
            sheet.expense_total,
            Decimal("6900.00"),
        )

        self.assertEqual(
            sheet.finance_amount,
            Decimal("86900.00"),
        )

        self.assertEqual(
            sheet.emi_principal,
            Decimal("86900.00"),
        )

        self.assertEqual(
            sheet.monthly_emi,
            Decimal("1448.33"),
        )

    # -----------------------------------------------------
    # Existing EMI does not change
    # -----------------------------------------------------

    def test_master_change_does_not_modify_existing_emi(
        self,
    ):

        sheet = create_emi_sheet(
            customer_name="Historical Snapshot Test",
            customer_mobile="0500000007",
            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "evaluation",
                    "amount": Decimal("99999.00"),
                }
            ],
            manual_vehicle=self.manual_vehicle(
                "SNAPSHOT-002"
            ),
        )

        original_expense = (
            sheet.expenses.get(
                expense_type="evaluation"
            )
        )

        self.assertEqual(
            original_expense.amount,
            Decimal("150.00"),
        )

        self.assertEqual(
            sheet.expense_total,
            Decimal("150.00"),
        )

        self.assertEqual(
            sheet.finance_amount,
            Decimal("80150.00"),
        )

        self.evaluation.amount = Decimal(
            "250.00"
        )

        self.evaluation.save()

        sheet.refresh_from_db()

        saved_expense = (
            sheet.expenses.get(
                expense_type="evaluation"
            )
        )

        self.assertEqual(
            saved_expense.amount,
            Decimal("150.00"),
        )

        self.assertEqual(
            sheet.expense_total,
            Decimal("150.00"),
        )

        self.assertEqual(
            sheet.finance_amount,
            Decimal("80150.00"),
        )

    # -----------------------------------------------------
    # New EMI uses updated Master value
    # -----------------------------------------------------

    def test_new_emi_uses_updated_master_value(
        self,
    ):

        self.evaluation.amount = Decimal(
            "250.00"
        )

        self.evaluation.save()

        sheet = create_emi_sheet(
            customer_name="New Master Value Test",
            customer_mobile="0500000008",
            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "evaluation",
                    "amount": Decimal("99999.00"),
                }
            ],
            manual_vehicle=self.manual_vehicle(
                "SNAPSHOT-003"
            ),
        )

        expense = (
            sheet.expenses.get(
                expense_type="evaluation"
            )
        )

        self.assertEqual(
            expense.amount,
            Decimal("250.00"),
        )

        self.assertEqual(
            sheet.expense_total,
            Decimal("250.00"),
        )

        self.assertEqual(
            sheet.finance_amount,
            Decimal("80250.00"),
        )

        self.assertEqual(
            sheet.emi_principal,
            Decimal("80250.00"),
        )

        self.assertEqual(
            sheet.monthly_emi,
            Decimal("1337.50"),
        )


# =========================================================
# EMI EXPENSE MODEL TESTS
# =========================================================


class EmiExpenseModelTests(
    FinanceTestMixin,
    TestCase,
):

    def setUp(self):

        self.bank = self.create_bank()

        self.create_emi_sequence()

    def test_expense_name_is_saved(self):

        sheet = create_emi_sheet(
            customer_name="Expense Name Test",
            customer_mobile="0500000010",
            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "custom",
                    "name": "Registration Fee",
                    "description": "RTA registration",
                    "amount": Decimal("500.00"),
                }
            ],
            manual_vehicle=self.manual_vehicle(
                "EXPENSE-NAME-001"
            ),
        )

        expense = sheet.expenses.get(
            expense_type="custom"
        )

        self.assertEqual(
            expense.name,
            "Registration Fee",
        )

        self.assertEqual(
            expense.description,
            "RTA registration",
        )

        self.assertEqual(
            expense.amount,
            Decimal("500.00"),
        )

    def test_multiple_expense_names_are_preserved(self):

        sheet = create_emi_sheet(
            customer_name="Multiple Names Test",
            customer_mobile="0500000011",
            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            expenses=[
                {
                    "expense_type": "custom_one",
                    "name": "Registration",
                    "description": "Registration charge",
                    "amount": Decimal("500.00"),
                },
                {
                    "expense_type": "custom_two",
                    "name": "Documentation",
                    "description": "Documentation charge",
                    "amount": Decimal("250.00"),
                },
            ],
            manual_vehicle=self.manual_vehicle(
                "EXPENSE-NAME-002"
            ),
        )

        expenses = {
            expense.expense_type:
            expense
            for expense in sheet.expenses.all()
        }

        self.assertEqual(
            expenses["custom_one"].name,
            "Registration",
        )

        self.assertEqual(
            expenses["custom_two"].name,
            "Documentation",
        )

        self.assertEqual(
            sheet.expense_total,
            Decimal("750.00"),
        )


# =========================================================
# BANK DELETION PROTECTION TESTS
# =========================================================


class BankDeletionProtectionTests(
    FinanceTestMixin,
    TestCase,
):

    def setUp(self):

        self.bank = self.create_bank()

        self.create_master_configuration(
            self.bank
        )

        self.create_emi_sequence()

    def test_bank_cannot_be_deleted_when_used_by_emi(
        self,
    ):

        sheet = create_emi_sheet(
            customer_name="Bank Protection Test",
            customer_mobile="0500000009",
            vehicle_price=Decimal("100000.00"),
            vat_enabled=False,
            down_payment=Decimal("20000.00"),
            tenure_years=5,
            bank_id=self.bank.id,
            expenses=[],
            manual_vehicle=self.manual_vehicle(
                "BANK-001"
            ),
        )

        self.assertEqual(
            sheet.bank_id,
            self.bank.id,
        )

        with self.assertRaises(
            ProtectedError
        ):

            self.bank.delete()

        self.assertTrue(
            Bank.objects.filter(
                pk=self.bank.id
            ).exists()
        )

    def test_bank_can_be_deactivated(self):

        self.bank.is_active = False

        self.bank.save()

        self.bank.refresh_from_db()

        self.assertFalse(
            self.bank.is_active
        )