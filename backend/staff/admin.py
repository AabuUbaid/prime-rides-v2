from django.contrib import admin

from .models import Staff


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "job_role",
        "status",
        "phone",
        "user",
        "join_date",
        "visa_expiry",
    )

    list_filter = (
        "status",
        "job_role",
    )

    search_fields = (
        "name",
        "phone",
        "user__email",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )