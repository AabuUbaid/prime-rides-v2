from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.crm.models import Customer

User = get_user_model()


@transaction.atomic
def create_customer(*, user: User | None = None, **data: Any) -> Customer:
    if user is not None and user.is_authenticated:
        data["created_by"] = user
        data["updated_by"] = user

    customer = Customer(**data)
    customer.full_clean()
    customer.save()
    return customer


@transaction.atomic
def update_customer(
    *,
    customer: Customer,
    user: User | None = None,
    **data: Any,
) -> Customer:
    if user is not None and user.is_authenticated:
        data["updated_by"] = user

    for field, value in data.items():
        setattr(customer, field, value)

    customer.full_clean()
    customer.save()
    return customer


@transaction.atomic
def delete_customer(
    *,
    customer: Customer,
    user: User | None = None,
) -> Customer:
    customer.is_active = False
    if user is not None and user.is_authenticated:
        customer.updated_by = user
        customer.save(update_fields=["is_active", "updated_by", "updated_at"])
    else:
        customer.save(update_fields=["is_active", "updated_at"])

    return customer
