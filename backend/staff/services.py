from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import Staff


User = get_user_model()


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
    password,
    first_name,
    last_name="",
    phone="",
    role=User.Roles.SALES_STAFF,
    staff_id=None,
    is_active=True,
):
    staff = None

    if staff_id is not None:
        staff = get_staff_or_raise(
            staff_id,
        )

        if staff.user_id is not None:
            raise ValidationError(
                "This Staff record is already linked to a user."
            )

    user = User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        role=role,
        is_active=is_active,
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
    email=None,
    first_name=None,
    last_name=None,
    phone=None,
    role=None,
    staff_id=None,
    is_active=None,
):
    if email is not None:
        user.email = email

    if first_name is not None:
        user.first_name = first_name

    if last_name is not None:
        user.last_name = last_name

    if phone is not None:
        user.phone = phone

    if role is not None:
        user.role = role

    if is_active is not None:
        user.is_active = is_active

    user.save()

    if staff_id is not None:
        new_staff = get_staff_or_raise(
            staff_id,
        )

        existing_staff = getattr(
            user,
            "staff_profile",
            None,
        )

        if (
            existing_staff is not None
            and existing_staff.id != new_staff.id
        ):
            existing_staff.user = None
            existing_staff.save(
                update_fields=[
                    "user",
                    "updated_at",
                ],
            )

        if (
            new_staff.user_id is not None
            and new_staff.user_id != user.id
        ):
            raise ValidationError(
                "This Staff record is already linked to another user."
            )

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
):
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