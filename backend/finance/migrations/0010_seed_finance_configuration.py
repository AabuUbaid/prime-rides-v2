from decimal import Decimal

from django.db import migrations


def seed_finance_configuration(apps, schema_editor):
    ExpensePreset = apps.get_model(
        "finance",
        "ExpensePreset",
    )
    InsuranceBand = apps.get_model(
        "finance",
        "InsuranceBand",
    )
    ServicePackage = apps.get_model(
        "finance",
        "ServicePackage",
    )
    Bank = apps.get_model(
        "finance",
        "Bank",
    )
    BankProcessingConfiguration = apps.get_model(
        "finance",
        "BankProcessingConfiguration",
    )

    # -------------------------------------------------
    # Expense presets
    # -------------------------------------------------

    ExpensePreset.objects.get_or_create(
        expense_type="rta",
        name="RTA Passing",
        defaults={
            "calculation_type": "fixed",
            "amount": Decimal("170.00"),
            "is_active": True,
        },
    )

    ExpensePreset.objects.get_or_create(
        expense_type="registration",
        name="Dubai Registration",
        defaults={
            "calculation_type": "conditional",
            "amount": Decimal("570.00"),
            "condition_key": "dubai_registration",
            "condition_value": "true",
            "is_active": True,
        },
    )

    ExpensePreset.objects.get_or_create(
        expense_type="registration",
        name="Non-Dubai Registration",
        defaults={
            "calculation_type": "conditional",
            "amount": Decimal("1150.00"),
            "condition_key": "dubai_registration",
            "condition_value": "false",
            "is_active": True,
        },
    )

    ExpensePreset.objects.get_or_create(
        expense_type="evaluation",
        name="Evaluation",
        defaults={
            "calculation_type": "fixed",
            "amount": Decimal("1000.00"),
            "is_active": True,
        },
    )

    # -------------------------------------------------
    # Insurance bands
    # -------------------------------------------------

    InsuranceBand.objects.get_or_create(
        name="Insurance 0 - 50,000",
        defaults={
            "minimum_vehicle_price": Decimal("0.00"),
            "maximum_vehicle_price": Decimal("50000.00"),
            "amount": Decimal("1990.00"),
            "is_active": True,
        },
    )

    InsuranceBand.objects.get_or_create(
        name="Insurance 50,000.01 - 90,000",
        defaults={
            "minimum_vehicle_price": Decimal("50000.01"),
            "maximum_vehicle_price": Decimal("90000.00"),
            "amount": Decimal("2800.00"),
            "is_active": True,
        },
    )

    InsuranceBand.objects.get_or_create(
        name="Insurance 90,000.01 - 130,000",
        defaults={
            "minimum_vehicle_price": Decimal("90000.01"),
            "maximum_vehicle_price": Decimal("130000.00"),
            "amount": Decimal("4100.00"),
            "is_active": True,
        },
    )

    # -------------------------------------------------
    # Service package
    # -------------------------------------------------

    ServicePackage.objects.get_or_create(
        name="Service Package",
        defaults={
            "description": "Default service package",
            "amount": Decimal("2800.00"),
            "is_active": True,
        },
    )

    # -------------------------------------------------
    # Bank processing configuration
    # -------------------------------------------------

    for bank in Bank.objects.all():
        application_charge = (
            Decimal("400.00")
            if bank.name.strip().upper() == "ADCB"
            else Decimal("0.00")
        )

        BankProcessingConfiguration.objects.update_or_create(
            bank=bank,
            defaults={
                "percentage": Decimal("1.2500"),
                "minimum_amount": Decimal("540.00"),
                "application_charge": application_charge,
                "is_active": True,
            },
        )


def reverse_finance_configuration(apps, schema_editor):
    ExpensePreset = apps.get_model(
        "finance",
        "ExpensePreset",
    )
    InsuranceBand = apps.get_model(
        "finance",
        "InsuranceBand",
    )
    ServicePackage = apps.get_model(
        "finance",
        "ServicePackage",
    )

    ExpensePreset.objects.filter(
        expense_type="rta",
        name="RTA Passing",
    ).delete()

    ExpensePreset.objects.filter(
        expense_type="registration",
        name__in=[
            "Dubai Registration",
            "Non-Dubai Registration",
        ],
    ).delete()

    ExpensePreset.objects.filter(
        expense_type="evaluation",
        name="Evaluation",
    ).delete()

    InsuranceBand.objects.filter(
        name__in=[
            "Insurance 0 - 50,000",
            "Insurance 50,000.01 - 90,000",
            "Insurance 90,000.01 - 130,000",
        ],
    ).delete()

    ServicePackage.objects.filter(
        name="Service Package",
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        (
            "finance",
            "0009_bankprocessingconfiguration_application_charge_and_more",
        ),
    ]

    operations = [
        migrations.RunPython(
            seed_finance_configuration,
            reverse_finance_configuration,
        ),
    ]