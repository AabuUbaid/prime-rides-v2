from __future__ import annotations

from django.db.models import Q
from django.shortcuts import get_object_or_404

from apps.crm.models import Customer, Lead


def customer_queryset():
    return Customer.objects.select_related(
        "assigned_to",
        "created_by",
        "updated_by",
    )


def lead_queryset():
    return Lead.objects.select_related(
        "customer",
        "assigned_to",
        "interested_vehicle",
        "interested_vehicle__vehicle_model",
        "interested_vehicle__vehicle_model__manufacturer",
        "interested_vehicle__generation",
        "interested_vehicle__variant",
        "interested_vehicle__fuel_type",
        "interested_vehicle__transmission",
        "interested_vehicle__drive_type",
        "interested_vehicle__body_type",
        "interested_vehicle__engine_type",
        "interested_vehicle__exterior_color",
        "interested_vehicle__interior_color",
        "interested_vehicle__status",
        "created_by",
        "updated_by",
    )


def list_customers():
    return customer_queryset()


def get_customer(customer_id):
    return get_object_or_404(customer_queryset(), pk=customer_id)


def search_customers(query):
    if not query:
        return customer_queryset()

    return customer_queryset().filter(
        Q(first_name__icontains=query)
        | Q(last_name__icontains=query)
        | Q(company_name__icontains=query)
        | Q(email__icontains=query)
        | Q(phone_number__icontains=query)
    )


def list_leads():
    return lead_queryset()


def get_lead(lead_id):
    return get_object_or_404(lead_queryset(), pk=lead_id)


def search_leads(query):
    if not query:
        return lead_queryset()

    return lead_queryset().filter(
        Q(customer__first_name__icontains=query)
        | Q(customer__last_name__icontains=query)
        | Q(customer__company_name__icontains=query)
        | Q(customer__phone_number__icontains=query)
        | Q(interested_vehicle__stock_number__icontains=query)
        | Q(interested_vehicle__vin__icontains=query)
    )
