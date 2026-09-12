from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from staff.models import Staff

from .models import (
    Lead,
    LeadActivity,
    LeadAssignmentHistory,
)


User = get_user_model()


def get_staff_for_sales_user(user):
    try:
        staff = Staff.objects.get(
            user=user,
            status=Staff.Status.ACTIVE,
        )
    except Staff.DoesNotExist:
        raise ValidationError(
            "The logged-in Sales Staff user is not linked "
            "to an active Staff record."
        )

    return staff


def validate_assignment(
    *,
    actor,
    assigned_to,
):
    if assigned_to is None:
        return

    if assigned_to.status != Staff.Status.ACTIVE:
        raise ValidationError(
            "Leads can only be assigned to active Staff."
        )

    if actor.role == "SALES_STAFF":
        actor_staff = get_staff_for_sales_user(
            actor,
        )

        if assigned_to.id != actor_staff.id:
            raise ValidationError(
                "Sales Staff can only assign a lead to themselves."
            )


@transaction.atomic
def create_lead(
    *,
    actor,
    phone_number,
    customer_name="",
    email="",
    enquiry_source,
    enquiry_status=Lead.Status.NEW,
    assigned_to=None,
    purpose="",
    notes="",
    insurance="",
    type_of_car="",
    brand="",
    mode_of_payment="",
    salary=None,
    date_of_birth=None,
    lead_from="",
):
    if actor.role == "SALES_STAFF":
        assigned_to = get_staff_for_sales_user(
            actor,
        )
    else:
        validate_assignment(
            actor=actor,
            assigned_to=assigned_to,
        )

    lead = Lead.objects.create(
        phone_number=phone_number,
        customer_name=customer_name,
        email=email,
        enquiry_source=enquiry_source,
        enquiry_status=enquiry_status,
        assigned_to=assigned_to,
        created_by=actor,
        purpose=purpose,
        notes=notes,
        insurance=insurance,
        type_of_car=type_of_car,
        brand=brand,
        mode_of_payment=mode_of_payment,
        salary=salary,
        date_of_birth=date_of_birth,
        lead_from=lead_from,
        last_activity_at=timezone.now(),
    )

    if assigned_to is not None:
        LeadAssignmentHistory.objects.create(
            lead=lead,
            previous_staff=None,
            new_staff=assigned_to,
            changed_by=actor,
        )

    return lead


@transaction.atomic
def update_lead(
    *,
    lead,
    actor,
    **validated_data,
):
    assigned_to_provided = "assigned_to" in validated_data

    new_assigned_to = validated_data.pop(
        "assigned_to",
        None,
    )

    if assigned_to_provided:
        if actor.role == "SALES_STAFF":
            raise ValidationError(
                "Sales Staff cannot reassign leads."
            )

        validate_assignment(
            actor=actor,
            assigned_to=new_assigned_to,
        )

        if (
            lead.assigned_to_id
            != getattr(
                new_assigned_to,
                "id",
                None,
            )
        ):
            LeadAssignmentHistory.objects.create(
                lead=lead,
                previous_staff=lead.assigned_to,
                new_staff=new_assigned_to,
                changed_by=actor,
            )

            lead.assigned_to = new_assigned_to

    for field, value in validated_data.items():
        setattr(
            lead,
            field,
            value,
        )

    lead.save()

    return lead


@transaction.atomic
def record_activity(
    *,
    lead,
    actor,
    note="",
):
    activity = LeadActivity.objects.create(
        lead=lead,
        note=note,
        created_by=actor,
    )

    lead.last_activity_at = activity.created_at
    lead.save(
        update_fields=[
            "last_activity_at",
            "updated_at",
        ],
    )

    return activity


def can_manage_lead(
    *,
    actor,
    lead,
):
    if actor.role in {
        "MASTER",
        "ADMIN",
    }:
        return True

    if actor.role == "SALES_STAFF":
        return (
            lead.assigned_to is not None
            and lead.assigned_to.user_id == actor.id
        )

    return False