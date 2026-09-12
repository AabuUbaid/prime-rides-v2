from django.contrib import admin

from .models import (
    Lead,
    LeadActivity,
    LeadAssignmentHistory,
)


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "phone_number",
        "customer_name",
        "enquiry_source",
        "enquiry_status",
        "assigned_to",
        "created_by",
        "last_activity_at",
    )

    list_filter = (
        "enquiry_source",
        "enquiry_status",
    )

    search_fields = (
        "phone_number",
        "customer_name",
        "email",
        "brand",
        "type_of_car",
    )

    readonly_fields = (
        "created_by",
        "last_activity_at",
        "created_at",
        "updated_at",
    )


@admin.register(LeadActivity)
class LeadActivityAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "lead",
        "created_by",
        "created_at",
    )

    search_fields = (
        "lead__phone_number",
        "lead__customer_name",
        "note",
    )

    readonly_fields = (
        "created_at",
    )


@admin.register(LeadAssignmentHistory)
class LeadAssignmentHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "lead",
        "previous_staff",
        "new_staff",
        "changed_by",
        "created_at",
    )

    readonly_fields = (
        "lead",
        "previous_staff",
        "new_staff",
        "changed_by",
        "created_at",
    )