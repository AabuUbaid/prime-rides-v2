from .models import (
    Bank,
    BankProcessingConfiguration,
    ExpensePreset,
    InsuranceBand,
    ServicePackage,
    CashDeal
)


# =========================================================
# BANKS
# =========================================================


def list_banks(
    *,
    active_only=False,
):
    """
    Return banks ordered by name.

    Args:
        active_only: Restrict results to active banks.
    """
    queryset = Bank.objects.all()

    if active_only:
        queryset = queryset.filter(
            is_active=True,
        )

    return queryset.order_by("name")


def get_bank(
    bank_id,
):
    """
    Return a bank by primary key.

    Raises:
        Bank.DoesNotExist
    """
    return Bank.objects.get(
        pk=bank_id,
    )


def get_active_bank(
    bank_id,
):
    """
    Return an active bank by primary key.

    Raises:
        Bank.DoesNotExist
    """
    return Bank.objects.get(
        pk=bank_id,
        is_active=True,
    )


# =========================================================
# EXPENSE PRESETS
# =========================================================


def list_expense_presets(
    *,
    expense_type=None,
    active_only=False,
):
    """
    Return expense presets ordered by type and name.

    Expense presets are Master-controlled configuration.
    """
    queryset = ExpensePreset.objects.all()

    if expense_type is not None:
        queryset = queryset.filter(
            expense_type=expense_type,
        )

    if active_only:
        queryset = queryset.filter(
            is_active=True,
        )

    return queryset.order_by(
        "expense_type",
        "name",
    )


def get_expense_preset(
    preset_id,
):
    """
    Return an expense preset by primary key.

    Raises:
        ExpensePreset.DoesNotExist
    """
    return ExpensePreset.objects.get(
        pk=preset_id,
    )


def get_active_expense_preset(
    preset_id,
):
    """
    Return an active expense preset by primary key.

    Raises:
        ExpensePreset.DoesNotExist
    """
    return ExpensePreset.objects.get(
        pk=preset_id,
        is_active=True,
    )


def get_active_expense_preset_by_type(
    expense_type,
):
    """
    Return the first active preset for an expense type.

    The selector intentionally does not perform any financial
    calculation. It only retrieves configuration.

    Multiple presets may exist for the same expense type.
    """
    return (
        ExpensePreset.objects
        .filter(
            expense_type=expense_type,
            is_active=True,
        )
        .order_by(
            "id",
        )
        .first()
    )


def get_active_expense_preset_by_type_and_name(
    *,
    expense_type,
    name,
):
    """
    Return an active expense preset matching both
    expense type and exact configuration name.

    This is used when the calculation requires a
    specific Master-configured preset rather than
    whichever preset happens to be first for an
    expense type.
    """
    return (
        ExpensePreset.objects
        .filter(
            expense_type=expense_type,
            name=name,
            is_active=True,
        )
        .first()
    )

def get_active_rta_preset():
    """
    Return the active Master-configured RTA Passing preset.
    """
    return get_active_expense_preset_by_type_and_name(
        expense_type="rta",
        name="RTA Passing",
    )


def get_active_evaluation_preset():
    """
    Return the active Master-configured Evaluation preset.
    """
    return get_active_expense_preset_by_type_and_name(
        expense_type="evaluation",
        name="Evaluation",
    )


def get_active_registration_preset(
    *,
    dubai_registration,
):
    """
    Return the active Master-configured registration preset
    for Dubai or non-Dubai registration.
    """
    return get_active_expense_preset_by_type_and_name(
        expense_type="registration",
        name=(
            "Dubai Registration"
            if dubai_registration
            else "Non-Dubai Registration"
        ),
    )
# =========================================================
# INSURANCE BANDS
# =========================================================


def list_insurance_bands(
    *,
    active_only=False,
):
    """
    Return insurance bands ordered by minimum vehicle price.
    """
    queryset = InsuranceBand.objects.all()

    if active_only:
        queryset = queryset.filter(
            is_active=True,
        )

    return queryset.order_by(
        "minimum_vehicle_price",
    )


def get_insurance_band(
    band_id,
):
    """
    Return an insurance band by primary key.

    Raises:
        InsuranceBand.DoesNotExist
    """
    return InsuranceBand.objects.get(
        pk=band_id,
    )


def get_active_insurance_band(
    band_id,
):
    """
    Return an active insurance band by primary key.

    Raises:
        InsuranceBand.DoesNotExist
    """
    return InsuranceBand.objects.get(
        pk=band_id,
        is_active=True,
    )


def get_insurance_band_for_vehicle_price(
    vehicle_price,
):
    """
    Return the active insurance band applicable to a
    vehicle price.

    Exactly one active band must match the price.

    Returns:
        InsuranceBand instance or None.

    Raises:
        InsuranceBand.MultipleObjectsReturned:
            If overlapping active bands match the price.
    """
    queryset = (
        InsuranceBand.objects
        .filter(
            is_active=True,
            minimum_vehicle_price__lte=vehicle_price,
            maximum_vehicle_price__gte=vehicle_price,
        )
        .order_by(
            "minimum_vehicle_price",
            "id",
        )
    )

    matches = list(queryset)

    if not matches:
        return None

    if len(matches) > 1:
        raise InsuranceBand.MultipleObjectsReturned(
            "Multiple active insurance bands match "
            f"vehicle price {vehicle_price}."
        )

    return matches[0]

# =========================================================
# SERVICE PACKAGES
# =========================================================


def list_service_packages(
    *,
    active_only=False,
):
    """
    Return service packages ordered by name.
    """
    queryset = ServicePackage.objects.all()

    if active_only:
        queryset = queryset.filter(
            is_active=True,
        )

    return queryset.order_by(
        "name",
    )


def get_service_package(
    package_id,
):
    """
    Return a service package by primary key.

    Raises:
        ServicePackage.DoesNotExist
    """
    return ServicePackage.objects.get(
        pk=package_id,
    )


def get_active_service_package(
    package_id,
):
    """
    Return an active service package by primary key.

    Raises:
        ServicePackage.DoesNotExist
    """
    return ServicePackage.objects.get(
        pk=package_id,
        is_active=True,
    )


def get_active_default_service_package():
    """
    Return the active Master-configured default
    Service Package.

    Service Package selection must not depend on
    a hardcoded package name.
    """
    return (
        ServicePackage.objects
        .filter(
            is_active=True,
            is_default=True,
        )
        .order_by("id")
        .first()
    )


# =========================================================
# BANK PROCESSING CONFIGURATION
# =========================================================


def list_bank_processing_configurations(
    *,
    active_only=False,
):
    """
    Return bank processing configurations with their
    associated bank.
    """
    queryset = (
        BankProcessingConfiguration.objects
        .select_related("bank")
        .all()
    )

    if active_only:
        queryset = queryset.filter(
            is_active=True,
        )

    return queryset.order_by(
        "bank__name",
    )


def get_bank_processing_configuration(
    bank_id,
):
    """
    Return the processing configuration for a bank.

    Raises:
        BankProcessingConfiguration.DoesNotExist
    """
    return (
        BankProcessingConfiguration.objects
        .select_related("bank")
        .get(
            bank_id=bank_id,
        )
    )


def get_active_bank_processing_configuration(
    bank_id,
):
    """
    Return the active processing configuration for a bank.

    Raises:
        BankProcessingConfiguration.DoesNotExist
    """
    return (
        BankProcessingConfiguration.objects
        .select_related("bank")
        .get(
            bank_id=bank_id,
            is_active=True,
        )
    )

def get_bank_processing_configuration_for_bank(
    bank_id,
):
    """
    Return the active bank-processing configuration
    for a specific bank.

    The configuration is database-controlled and
    includes percentage, minimum amount, and
    banker application charge.
    """
    return (
        BankProcessingConfiguration.objects
        .select_related("bank")
        .get(
            bank_id=bank_id,
            is_active=True,
        )
    )
    
    
class CashDealSelector:

    @staticmethod
    def list_cash_deals(
        *,
        search=None,
        status=None,
        agent=None,
        customer=None,
        payment_method=None,
        ordering="-created_at",
    ):
        queryset = (
            CashDeal.objects
            .select_related(
                "quote",
                "customer",
                "car",
                "agent",
            )
            .order_by(ordering)
        )

        if search:
            queryset = queryset.filter(
                Q(deal_number__icontains=search)
                | Q(customer_name__icontains=search)
                | Q(customer_mobile__icontains=search)
                | Q(vehicle_stock_id__icontains=search)
                | Q(vehicle_make__icontains=search)
                | Q(vehicle_model__icontains=search)
            )

        if status:
            queryset = queryset.filter(
                status=status,
            )

        if agent:
            queryset = queryset.filter(
                agent_id=agent,
            )

        if customer:
            queryset = queryset.filter(
                customer_id=customer,
            )

        if payment_method:
            queryset = queryset.filter(
                payment_method=payment_method,
            )

        return queryset

    @staticmethod
    def get_cash_deal_by_id(deal_id):
        return get_object_or_404(
            CashDeal.objects.select_related(
                "quote",
                "customer",
                "car",
                "agent",
            ),
            id=deal_id,
        )