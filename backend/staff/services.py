from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import Staff


User = get_user_model()

_UNSET = object()


@transaction.atomic
def create_staff(
    *,
    name,
    phone="",
    join_date=None,
    job_role,
    base_salary=0,
    visa_expiry=None,
    leave_balance=0,
    notes="",
    status=Staff.Status.ACTIVE,
):
    return Staff.objects.create(
        name=name,
        phone=phone,
        join_date=join_date,
        job_role=job_role,
        base_salary=base_salary,
        visa_expiry=visa_expiry,
        leave_balance=leave_balance,
        notes=notes,
        status=status,
    )


@transaction.atomic
def update_staff(
    *,
    staff,
    **validated_data,
):
    for field, value in validated_data.items():
        setattr(
            staff,
            field,
            value,
        )

    staff.save()

    return staff


@transaction.atomic
def delete_staff(
    *,
    staff,
):
    staff.delete()


@transaction.atomic
def deactivate_staff(
    *,
    staff,
):
    staff.status = Staff.Status.INACTIVE
    staff.save(
        update_fields=[
            "status",
            "updated_at",
        ],
    )

    return staff


@transaction.atomic
def activate_staff(
    *,
    staff,
):
    staff.status = Staff.Status.ACTIVE
    staff.save(
        update_fields=[
            "status",
            "updated_at",
        ],
    )

    return staff


def get_user_or_raise(user_id):
    try:
        return User.objects.get(
            pk=user_id,
        )
    except User.DoesNotExist:
        raise ValidationError(
            "User not found."
        )


def get_staff_or_raise(staff_id):
    try:
        return Staff.objects.get(
            pk=staff_id,
        )
    except Staff.DoesNotExist:
        raise ValidationError(
            "Staff record not found."
        )


@transaction.atomic
def create_user_access(
    *,
    email,
    first_name,
    last_name="",
    phone="",
    role=None,
    password=None,
    is_active=True,
    staff_id=None,
    **extra_data,
):
    staff = None

    if staff_id is not None:
        try:
            staff = (
                Staff.objects
                .select_for_update()
                .get(pk=staff_id)
            )
        except Staff.DoesNotExist:
            raise ValidationError(
                "Staff record not found."
            )

        if staff.status != Staff.Status.ACTIVE:
            raise ValidationError(
                "Only active staff members can be linked to User Access."
            )

        if staff.user_id is not None:
            raise ValidationError(
                "This staff member is already linked to a user."
            )

    user = User.objects.create_user(
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        role=role,
        password=password,
        is_active=is_active,
        **extra_data,
    )

    if staff is not None:
        staff.user = user
        staff.save(
            update_fields=[
                "user",
                "updated_at",
            ],
        )

    return user


@transaction.atomic
def update_user_access(
    *,
    user,
    **validated_data,
):
    staff_id = validated_data.pop(
        "staff_id",
        _UNSET,
    )

    for field, value in validated_data.items():
        setattr(
            user,
            field,
            value,
        )

    user.save()

    if staff_id is not _UNSET:
        current_staff = (
            Staff.objects
            .select_for_update()
            .filter(user=user)
            .first()
        )

        # Explicitly unlink the current Staff record.
        if staff_id is None:
            if current_staff is not None:
                current_staff.user = None
                current_staff.save(
                    update_fields=[
                        "user",
                        "updated_at",
                    ],
                )

        else:
            try:
                new_staff = (
                    Staff.objects
                    .select_for_update()
                    .get(pk=staff_id)
                )
            except Staff.DoesNotExist:
                raise ValidationError(
                    "Staff record not found."
                )

            if new_staff.status != Staff.Status.ACTIVE:
                raise ValidationError(
                    "Only active staff members can be linked to User Access."
                )

            if (
                new_staff.user_id is not None
                and new_staff.user_id != user.id
            ):
                raise ValidationError(
                    "This staff member is already linked to another user."
                )

            # Remove the old Staff link if the user is being
            # transferred to a different Staff record.
            if (
                current_staff is not None
                and current_staff.id != new_staff.id
            ):
                current_staff.user = None
                current_staff.save(
                    update_fields=[
                        "user",
                        "updated_at",
                    ],
                )

            # Link the new Staff record.
            if new_staff.user_id != user.id:
                new_staff.user = user
                new_staff.save(
                    update_fields=[
                        "user",
                        "updated_at",
                    ],
                )

    return user


@transaction.atomic
def change_user_password(
    *,
    user,
    password,
):
    user.set_password(password)

    user.save(
        update_fields=[
            "password",
            "updated_at",
        ],
    )

    return user


@transaction.atomic
def deactivate_user(
    *,
    user,
    actor=None,
):
    if actor is not None and actor.id == user.id:
        raise ValidationError(
            "You cannot deactivate your own user account."
        )

    user.is_active = False

    user.save(
        update_fields=[
            "is_active",
            "updated_at",
        ],
    )

    return user


@transaction.atomic
def activate_user(
    *,
    user,
):
    user.is_active = True

    user.save(
        update_fields=[
            "is_active",
            "updated_at",
        ],
    )

    return user

from decimal import Decimal

from django.db.models import DecimalField, F, Sum, Value
from django.db.models.functions import Coalesce

from progression.models import Progression


def get_staff_performance(*, staff):
    """
    Calculate sales performance from completed Progressions.

    The salesperson on the Quote is the authoritative deal owner.
    Performance is derived rather than stored as counters.
    """

    completed_progressions = (
        Progression.objects
        .filter(
            status=Progression.Status.COMPLETED,
            quote__salesperson=staff.user,
        )
        .select_related(
            "quote",
            "quote__car",
        )
    )

    vehicles_sold = completed_progressions.count()

    sales_value = completed_progressions.aggregate(
        total=Coalesce(
            Sum("quote__price"),
            Value(Decimal("0.00")),
            output_field=DecimalField(
                max_digits=14,
                decimal_places=2,
            ),
        )
    )["total"]

    profit = completed_progressions.annotate(
        deal_profit=F("quote__price") - F("quote__car__purchase_cost")
    ).aggregate(
        total=Coalesce(
            Sum("deal_profit"),
            Value(Decimal("0.00")),
            output_field=DecimalField(
                max_digits=14,
                decimal_places=2,
            ),
        )
    )["total"]

    return {
        "staff_id": staff.id,
        "staff_name": staff.name,
        "vehicles_sold": vehicles_sold,
        "sales_value": sales_value,
        "profit": profit,
    }