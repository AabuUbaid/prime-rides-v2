from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.crm.models import Lead, LeadStatus

User = get_user_model()


@transaction.atomic
def create_lead(*, user: User | None = None, **data: Any) -> Lead:
    if user is not None and user.is_authenticated:
        data["created_by"] = user
        data["updated_by"] = user

    lead = Lead(**data)
    lead.full_clean()
    lead.save()
    return lead


@transaction.atomic
def update_lead(
    *,
    lead: Lead,
    user: User | None = None,
    **data: Any,
) -> Lead:
    if user is not None and user.is_authenticated:
        data["updated_by"] = user

    for field, value in data.items():
        setattr(lead, field, value)

    lead.full_clean()
    lead.save()
    return lead


@transaction.atomic
def change_lead_status(
    *,
    lead: Lead,
    status: str,
    user: User | None = None,
    lost_reason: str = "",
) -> Lead:
    lead.status = status
    if status == LeadStatus.LOST:
        lead.lost_reason = lost_reason
    if status == LeadStatus.WON and lead.converted_at is None:
        lead.converted_at = timezone.now()

    if user is not None and user.is_authenticated:
        lead.updated_by = user

    lead.full_clean()
    lead.save()
    return lead


@transaction.atomic
def assign_lead(
    *,
    lead: Lead,
    assigned_to: User | None,
    user: User | None = None,
) -> Lead:
    lead.assigned_to = assigned_to
    if user is not None and user.is_authenticated:
        lead.updated_by = user

    lead.full_clean()
    lead.save()
    return lead


@transaction.atomic
def delete_lead(*, lead: Lead, user: User | None = None) -> Lead:
    lead.is_active = False
    if user is not None and user.is_authenticated:
        lead.updated_by = user
        lead.save(update_fields=["is_active", "updated_by", "updated_at"])
    else:
        lead.save(update_fields=["is_active", "updated_at"])

    return lead
