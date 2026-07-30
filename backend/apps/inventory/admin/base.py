from django.contrib import admin


class BaseAdmin(admin.ModelAdmin):
    """
    Base admin for all transaction models.
    """

    readonly_fields = (
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
    )

    list_per_page = 25

    save_on_top = True

    show_full_result_count = True