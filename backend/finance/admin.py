from django.contrib import admin

from .models import Bank, EmiExpense, EmiSheet


@admin.register(Bank)
class BankAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "interest_rate",
        "is_cash",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_cash",
        "is_active",
    )

    search_fields = (
        "name",
    )

    ordering = (
        "name",
    )


@admin.register(EmiSheet)
class EmiSheetAdmin(admin.ModelAdmin):
    list_display = (
        "emi_number",
        "customer_name",
        "customer_mobile",
        "vehicle_stock_id",
        "bank_name",
        "interest_rate",
        "finance_amount",
        "monthly_emi",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "bank",
        "created_at",
    )

    search_fields = (
        "emi_number",
        "customer_name",
        "customer_mobile",
        "vehicle_stock_id",
        "vehicle_make",
        "vehicle_model",
    )

    readonly_fields = (
        "emi_number",
        "bank_name",
        "interest_rate",
        "vehicle_stock_id",
        "vehicle_make",
        "vehicle_model",
        "vehicle_variant",
        "vehicle_year",
        "vehicle_colour",
        "vat_amount",
        "price_after_vat",
        "finance_amount",
        "total_interest",
        "total_payable",
        "monthly_emi",
        "created_at",
        "updated_at",
        "vehicle_mileage",
        "vehicle_chassis_number",
        "vehicle_engine_number",
        "manual_rate_used",
    )


@admin.register(EmiExpense)
class EmiExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "emi_sheet",
        "expense_type",
        "description",
        "amount",
        "created_at",
    )

    list_filter = (
        "expense_type",
        "created_at",
    )

    search_fields = (
        "emi_sheet__emi_number",
        "emi_sheet__customer_name",
        "description",
    )