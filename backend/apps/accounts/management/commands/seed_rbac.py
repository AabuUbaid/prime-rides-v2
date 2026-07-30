from django.core.management.base import BaseCommand
from apps.common.constants import Permissions
from apps.accounts.models import Permission, Role


class Command(BaseCommand):
    help = "Seed default RBAC roles and permissions"

    def handle(self, *args, **kwargs):

        permissions = [

        (Permissions.INVENTORY_VIEW, "View Inventory"),
        (Permissions.INVENTORY_CREATE, "Create Inventory"),
        (Permissions.INVENTORY_EDIT, "Edit Inventory"),
        (Permissions.INVENTORY_DELETE, "Delete Inventory"),

        (Permissions.PROCUREMENT_VIEW, "View Procurement"),
        (Permissions.PROCUREMENT_CREATE, "Create Procurement"),
        (Permissions.PROCUREMENT_EDIT, "Edit Procurement"),
        (Permissions.PROCUREMENT_DELETE, "Delete Procurement"),

        (Permissions.CRM_VIEW, "View CRM"),
        (Permissions.CRM_CREATE, "Create CRM"),
        (Permissions.CRM_EDIT, "Edit CRM"),
        (Permissions.CRM_DELETE, "Delete CRM"),

        (Permissions.QUOTATION_VIEW, "View Quotations"),
        (Permissions.QUOTATION_CREATE, "Create Quotations"),
        (Permissions.QUOTATION_EDIT, "Edit Quotations"),
        (Permissions.QUOTATION_DELETE, "Delete Quotations"),

        (Permissions.FINANCE_VIEW, "View Finance"),
        (Permissions.FINANCE_CREATE, "Create Finance"),
        (Permissions.FINANCE_EDIT, "Edit Finance"),

        (Permissions.REPORT_VIEW, "View Reports"),

        (Permissions.DASHBOARD_VIEW, "View Dashboard"),

        ]

        permission_objects = {}

        for code, name in permissions:
            permission, _ = Permission.objects.get_or_create(
                code=code,
                defaults={"name": name},
            )
            permission_objects[code] = permission

        master, _ = Role.objects.get_or_create(name="MASTER")
        admin, _ = Role.objects.get_or_create(name="ADMIN")
        sales, _ = Role.objects.get_or_create(name="SALES")

        # MASTER → everything
        master.permissions.set(permission_objects.values())

        # ADMIN
        admin.permissions.set([
             permission_objects[Permissions.INVENTORY_VIEW],
            permission_objects[Permissions.INVENTORY_CREATE],
            permission_objects[Permissions.INVENTORY_EDIT],

            permission_objects[Permissions.PROCUREMENT_VIEW],
            permission_objects[Permissions.PROCUREMENT_CREATE],
            permission_objects[Permissions.PROCUREMENT_EDIT],

            permission_objects[Permissions.CRM_VIEW],
            permission_objects[Permissions.CRM_CREATE],
            permission_objects[Permissions.CRM_EDIT],

            permission_objects[Permissions.QUOTATION_VIEW],
            permission_objects[Permissions.QUOTATION_CREATE],
            permission_objects[Permissions.QUOTATION_EDIT],

            permission_objects[Permissions.FINANCE_VIEW],
            permission_objects[Permissions.FINANCE_CREATE],

            permission_objects[Permissions.REPORT_VIEW],

            permission_objects[Permissions.DASHBOARD_VIEW],
        ])

        # SALES
        sales.permissions.set([
            permission_objects[Permissions.INVENTORY_VIEW],
            permission_objects[Permissions.CRM_VIEW],
            permission_objects[Permissions.QUOTATION_VIEW],
            permission_objects[Permissions.QUOTATION_CREATE],
        ])

        self.stdout.write(
            self.style.SUCCESS("RBAC seeded successfully.")
        )
