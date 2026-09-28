from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Staff(models.Model):
    class JobRole(models.TextChoices):
        SALES_EXECUTIVE = "SALES_EXECUTIVE", "Sales Executive"
        PROCUREMENT = "PROCUREMENT", "Procurement"
        ACCOUNTS = "ACCOUNTS", "Accounts"
        ADMIN = "ADMIN", "Admin"
        MANAGER = "MANAGER", "Manager"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"

    id = models.BigAutoField(primary_key=True)

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_profile",
    )

    name = models.CharField(max_length=255)

    phone = models.CharField(
        max_length=30,
        blank=True,
    )

    join_date = models.DateField(
        null=True,
        blank=True,
    )

    job_role = models.CharField(
        max_length=30,
        choices=JobRole.choices,
    )

    base_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )

    visa_expiry = models.DateField(
        null=True,
        blank=True,
    )

    leave_balance = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )

    notes = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "staff"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["job_role"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return self.name
    
class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        HALF_DAY = "HALF_DAY", "Half Day"
        LEAVE = "LEAVE", "Leave"
        HOLIDAY = "HOLIDAY", "Holiday"

    staff = models.ForeignKey(
        Staff,
        on_delete=models.PROTECT,
        related_name="attendance_records",
    )

    attendance_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
    )

    check_in = models.TimeField(
        null=True,
        blank=True,
    )

    check_out = models.TimeField(
        null=True,
        blank=True,
    )

    notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "staff_attendance"

        ordering = [
            "-attendance_date",
            "staff_id",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["staff", "attendance_date"],
                name="unique_staff_attendance_date",
            ),
        ]

        indexes = [
            models.Index(
                fields=["staff", "attendance_date"],
            ),
            models.Index(
                fields=["attendance_date"],
            ),
            models.Index(
                fields=["status"],
            ),
        ]

    def __str__(self):
        return f"{self.staff.name} - {self.attendance_date} - {self.status}"
    
    
    
class Payroll(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PROCESSED = "PROCESSED", "Processed"
        PAID = "PAID", "Paid"
        CANCELLED = "CANCELLED", "Cancelled"

    staff = models.ForeignKey(
        Staff,
        on_delete=models.PROTECT,
        related_name="payroll_records",
    )

    payroll_year = models.PositiveIntegerField()

    payroll_month = models.PositiveSmallIntegerField()

    # Snapshot of the employee's salary at the time payroll is created.
    base_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )

    # Additional earnings entered for this payroll period.
    allowances = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )

    # Additional deductions entered for this payroll period.
    deductions = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )

    # Final amount payable for the payroll period.
    net_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    payment_date = models.DateField(
        null=True,
        blank=True,
    )

    notes = models.TextField(
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_payroll_records",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "staff_payroll"

        ordering = [
            "-payroll_year",
            "-payroll_month",
            "staff_id",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["staff", "payroll_year", "payroll_month"],
                name="unique_staff_payroll_period",
            ),
            models.CheckConstraint(
                condition=models.Q(payroll_month__gte=1)
                & models.Q(payroll_month__lte=12),
                name="valid_payroll_month",
            ),
        ]

        indexes = [
            models.Index(
                fields=["staff", "payroll_year", "payroll_month"],
            ),
            models.Index(
                fields=["payroll_year", "payroll_month"],
            ),
            models.Index(
                fields=["status"],
            ),
        ]

    def __str__(self):
        return (
            f"{self.staff.name} - "
            f"{self.payroll_year}-{self.payroll_month:02d}"
        )