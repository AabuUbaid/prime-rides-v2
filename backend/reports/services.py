from datetime import datetime, time, timedelta

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone

from finance.models import BankLoan, CashDeal, CashReceipt
from inventory.models import Car
from progression.models import Progression
from quotes.models import Quote


class ReportService:
    PERIOD_DAILY = "daily"
    PERIOD_WEEKLY = "weekly"
    PERIOD_MONTHLY = "monthly"

    VALID_PERIODS = {
        PERIOD_DAILY,
        PERIOD_WEEKLY,
        PERIOD_MONTHLY,
    }

    @classmethod
    def get_date_range(
        cls,
        period=None,
        date_from=None,
        date_to=None,
        reference_date=None,
    ):
        """
        Resolve the requested reporting period.

        Explicit date_from/date_to take precedence over period.

        Supported:
        - daily
        - weekly
        - monthly
        """

        reference_date = (
            reference_date
            or timezone.localdate()
        )

        if date_from or date_to:
            resolved_from = date_from or date_to
            resolved_to = date_to or date_from

            if resolved_from > resolved_to:
                raise ValueError(
                    "date_from cannot be after date_to."
                )

            return resolved_from, resolved_to

        period = (
            period.lower()
            if period
            else cls.PERIOD_DAILY
        )

        if period not in cls.VALID_PERIODS:
            raise ValueError(
                "Invalid period. "
                "Expected one of: "
                f"{', '.join(sorted(cls.VALID_PERIODS))}."
            )

        # -------------------------------------------------
        # DAILY
        # -------------------------------------------------

        if period == cls.PERIOD_DAILY:
            return (
                reference_date,
                reference_date,
            )

        # -------------------------------------------------
        # WEEKLY
        # Monday -> Sunday
        # -------------------------------------------------

        if period == cls.PERIOD_WEEKLY:
            start = (
                reference_date
                - timedelta(
                    days=reference_date.weekday()
                )
            )

            end = (
                start
                + timedelta(days=6)
            )

            return start, end

        # -------------------------------------------------
        # MONTHLY
        # Calendar month
        # -------------------------------------------------

        if period == cls.PERIOD_MONTHLY:
            start = reference_date.replace(
                day=1
            )

            if start.month == 12:
                next_month = start.replace(
                    year=start.year + 1,
                    month=1,
                )
            else:
                next_month = start.replace(
                    month=start.month + 1,
                )

            end = (
                next_month
                - timedelta(days=1)
            )

            return start, end

        raise ValueError(
            "Unable to resolve reporting period."
        )

    # =====================================================
    # DATE / QUERY HELPERS
    # =====================================================

    @staticmethod
    def datetime_range(
        date_from,
        date_to,
    ):
        """
        Convert an inclusive date range into a
        timezone-aware datetime range.

        End datetime is exclusive.
        """

        start_naive = datetime.combine(
            date_from,
            time.min,
        )

        end_naive = datetime.combine(
            date_to + timedelta(days=1),
            time.min,
        )

        start = timezone.make_aware(
            start_naive,
            timezone.get_current_timezone(),
        )

        end = timezone.make_aware(
            end_naive,
            timezone.get_current_timezone(),
        )

        return start, end

    @staticmethod
    def apply_sales_staff_scope(
        queryset,
        user,
        salesperson_paths,
    ):
        """
        Restrict Sales Staff to records belonging to them.

        salesperson_paths is a list of ORM paths.
        """

        if (
            getattr(user, "role", None)
            != "SALES_STAFF"
        ):
            return queryset

        if not salesperson_paths:
            return queryset

        condition = Q()

        for path in salesperson_paths:
            condition |= Q(**{path: user})

        return queryset.filter(condition).distinct()

    @staticmethod
    def branch_filter(
        queryset,
        branch_id,
        path="car__branch_id",
    ):
        if branch_id in (None, ""):
            return queryset

        return queryset.filter(
            **{path: branch_id}
        )

    # =====================================================
    # SALES REPORT
    # =====================================================

    @classmethod
    def sales_report(
        cls,
        *,
        user,
        date_from,
        date_to,
        branch_id=None,
    ):
        """
        Sales are based on Quote records whose status is SOLD.

        There is no dedicated sold_at field in Quote.
        Quote.updated_at is therefore used as the existing
        status-update timestamp for this report.
        """

        start_dt, end_dt = cls.datetime_range(
            date_from,
            date_to,
        )

        queryset = Quote.objects.filter(
            status=Quote.Status.SOLD,
            updated_at__gte=start_dt,
            updated_at__lt=end_dt,
        )

        queryset = cls.apply_sales_staff_scope(
            queryset,
            user,
            ["salesperson"],
        )

        queryset = cls.branch_filter(
            queryset,
            branch_id,
            "car__branch_id",
        )

        summary = queryset.aggregate(
            total_sales=Count("id"),
            total_sales_value=Sum("price"),
            average_sale_value=Avg("price"),
        )

        payment_methods = list(
            queryset
            .values("payment_method")
            .annotate(
                count=Count("id"),
                total_value=Sum("price"),
            )
            .order_by("payment_method")
        )

        salespeople = list(
            queryset
            .values("salesperson_id")
            .annotate(
                count=Count("id"),
                total_value=Sum("price"),
            )
            .order_by("-count")
        )

        branches = list(
            queryset
            .values("car__branch_id")
            .annotate(
                count=Count("id"),
                total_value=Sum("price"),
            )
            .order_by("-count")
        )

        return {
            "report": "sales",
            "date_field": "quote.updated_at",
            "date_field_note": (
                "Quote.updated_at is used because the "
                "existing Quote model has no dedicated sold_at field."
            ),
            "date_from": date_from,
            "date_to": date_to,
            "branch_id": branch_id,
            "summary": summary,
            "by_payment_method": payment_methods,
            "by_salesperson": salespeople,
            "by_branch": branches,
        }

    # =====================================================
    # INVENTORY REPORT
    # =====================================================

    @classmethod
    def inventory_report(
        cls,
        *,
        user,
        date_from,
        date_to,
        branch_id=None,
    ):
        """
        Inventory does not have historical status snapshots.

        Therefore:
        - current_snapshot represents the current Car table
        - period_additions represents vehicles created during
          the requested reporting period
        """

        start_dt, end_dt = cls.datetime_range(
            date_from,
            date_to,
        )

        current_queryset = Car.objects.all()

        current_queryset = cls.branch_filter(
            current_queryset,
            branch_id,
            "branch_id",
        )

        additions_queryset = Car.objects.filter(
            created_at__gte=start_dt,
            created_at__lt=end_dt,
        )

        additions_queryset = cls.branch_filter(
            additions_queryset,
            branch_id,
            "branch_id",
        )

        current_aggregates = {
            "total_vehicles": Count("id"),
            "inventory_value": Sum("asking_price"),
        }
        if getattr(user, "role", None) == "MASTER":
            current_aggregates["total_purchase_cost"] = Sum(
                "purchase_cost"
            )

        current_summary = current_queryset.aggregate(
            **current_aggregates,
        )

        status_breakdown = list(
            current_queryset
            .values("status")
            .annotate(
                count=Count("id"),
                asking_price_total=Sum("asking_price"),
            )
            .order_by("status")
        )

        branch_breakdown = list(
            current_queryset
            .values("branch_id")
            .annotate(
                count=Count("id"),
                asking_price_total=Sum("asking_price"),
            )
            .order_by("-count")
        )

        additions_aggregates = {
            "vehicles_added": Count("id"),
            "asking_price_total": Sum("asking_price"),
        }
        if getattr(user, "role", None) == "MASTER":
            additions_aggregates["purchase_cost_total"] = Sum(
                "purchase_cost"
            )

        additions_summary = additions_queryset.aggregate(
            **additions_aggregates,
        )

        additions_by_source = list(
            additions_queryset
            .values("source")
            .annotate(
                count=Count("id"),
            )
            .order_by("source")
        )

        additions_by_status = list(
            additions_queryset
            .values("status")
            .annotate(
                count=Count("id"),
            )
            .order_by("status")
        )

        return {
            "report": "inventory",
            "date_from": date_from,
            "date_to": date_to,
            "branch_id": branch_id,
            "current_snapshot": {
                "summary": current_summary,
                "by_status": status_breakdown,
                "by_branch": branch_breakdown,
            },
            "period_additions": {
                "summary": additions_summary,
                "by_source": additions_by_source,
                "by_status": additions_by_status,
            },
        }

    # =====================================================
    # CASH / RECEIPT REPORT
    # =====================================================

    @classmethod
    def cash_receipt_report(
        cls,
        *,
        user,
        date_from,
        date_to,
        branch_id=None,
    ):
        """
        CashReceipt is the authoritative financial transaction
        source for this report.
        """

        queryset = CashReceipt.objects.filter(
            transaction_date__gte=date_from,
            transaction_date__lte=date_to,
        )

        queryset = cls.apply_sales_staff_scope(
            queryset,
            user,
            ["quote__salesperson"],
        )

        queryset = cls.branch_filter(
            queryset,
            branch_id,
            "car__branch_id",
        )

        summary = queryset.aggregate(
            receipt_count=Count("id"),
            total_amount=Sum("amount"),
        )

        by_direction = list(
            queryset
            .values("direction")
            .annotate(
                count=Count("id"),
                total_amount=Sum("amount"),
            )
            .order_by("direction")
        )

        by_category = list(
            queryset
            .values("category")
            .annotate(
                count=Count("id"),
                total_amount=Sum("amount"),
            )
            .order_by("category")
        )

        by_payment_method = list(
            queryset
            .values("payment_method")
            .annotate(
                count=Count("id"),
                total_amount=Sum("amount"),
            )
            .order_by("payment_method")
        )

        return {
            "report": "cash-receipts",
            "date_field": "cash_receipt.transaction_date",
            "date_from": date_from,
            "date_to": date_to,
            "branch_id": branch_id,
            "summary": summary,
            "by_direction": by_direction,
            "by_category": by_category,
            "by_payment_method": by_payment_method,
        }

    # =====================================================
    # FINANCE REPORT
    # =====================================================

    @classmethod
    def finance_report(
        cls,
        *,
        user,
        date_from,
        date_to,
        branch_id=None,
    ):
        """
        Finance reporting uses existing BankLoan and CashDeal
        records. No additional finance/ledger model is created.
        """

        start_dt, end_dt = cls.datetime_range(
            date_from,
            date_to,
        )

        bank_loans = BankLoan.objects.filter(
            created_at__gte=start_dt,
            created_at__lt=end_dt,
        )

        bank_loans = cls.apply_sales_staff_scope(
            bank_loans,
            user,
            [
                "quote__salesperson",
                "agent",
            ],
        )

        bank_loans = cls.branch_filter(
            bank_loans,
            branch_id,
            "car__branch_id",
        )

        cash_deals = CashDeal.objects.filter(
            created_at__gte=start_dt,
            created_at__lt=end_dt,
        )

        cash_deals = cls.apply_sales_staff_scope(
            cash_deals,
            user,
            [
                "quote__salesperson",
                "agent",
            ],
        )

        cash_deals = cls.branch_filter(
            cash_deals,
            branch_id,
            "car__branch_id",
        )

        bank_summary = bank_loans.aggregate(
            applications=Count("id"),
            requested_finance=Sum("requested_finance"),
            approved_finance=Sum("approved_finance"),
        )

        bank_status = list(
            bank_loans
            .values("status")
            .annotate(
                count=Count("id"),
                requested_finance=Sum(
                    "requested_finance"
                ),
                approved_finance=Sum(
                    "approved_finance"
                ),
            )
            .order_by("status")
        )

        application_status = list(
            bank_loans
            .values("application_status")
            .annotate(
                count=Count("id"),
            )
            .order_by("application_status")
        )

        banks = list(
            bank_loans
            .values("bank_name")
            .annotate(
                count=Count("id"),
                requested_finance=Sum(
                    "requested_finance"
                ),
                approved_finance=Sum(
                    "approved_finance"
                ),
            )
            .order_by("-count")
        )

        cash_summary = cash_deals.aggregate(
            deals=Count("id"),
            selling_price=Sum("selling_price"),
            advance_amount=Sum("advance_amount"),
            balance_amount=Sum("balance_amount"),
        )

        cash_status = list(
            cash_deals
            .values("status")
            .annotate(
                count=Count("id"),
                selling_price=Sum("selling_price"),
                advance_amount=Sum("advance_amount"),
                balance_amount=Sum("balance_amount"),
            )
            .order_by("status")
        )

        return {
            "report": "finance",
            "date_field": (
                "bank_loan.created_at / cash_deal.created_at"
            ),
            "date_from": date_from,
            "date_to": date_to,
            "branch_id": branch_id,
            "bank_loans": {
                "summary": bank_summary,
                "by_status": bank_status,
                "by_application_status": application_status,
                "by_bank": banks,
            },
            "cash_deals": {
                "summary": cash_summary,
                "by_status": cash_status,
            },
        }

    # =====================================================
    # VEHICLE ADDITION REPORT
    # =====================================================

    @classmethod
    def vehicle_addition_report(
        cls,
        *,
        user,
        date_from,
        date_to,
        branch_id=None,
    ):
        """
        Vehicle additions use Car.created_at.
        """

        start_dt, end_dt = cls.datetime_range(
            date_from,
            date_to,
        )

        queryset = Car.objects.filter(
            created_at__gte=start_dt,
            created_at__lt=end_dt,
        )

        queryset = cls.branch_filter(
            queryset,
            branch_id,
            "branch_id",
        )

        aggregate_fields = {
            "vehicles_added": Count("id"),
            "asking_price_total": Sum("asking_price"),
        }
        if getattr(user, "role", None) == "MASTER":
            aggregate_fields["purchase_cost_total"] = Sum(
                "purchase_cost"
            )

        summary = queryset.aggregate(**aggregate_fields)

        by_branch = list(
            queryset
            .values("branch_id")
            .annotate(
                count=Count("id"),
                purchase_cost_total=Sum(
                    "purchase_cost"
                ),
                asking_price_total=Sum(
                    "asking_price"
                ),
            )
            .order_by("-count")
        )

        by_source = list(
            queryset
            .values("source")
            .annotate(
                count=Count("id"),
            )
            .order_by("source")
        )

        by_status = list(
            queryset
            .values("status")
            .annotate(
                count=Count("id"),
            )
            .order_by("status")
        )

        return {
            "report": "vehicle-additions",
            "date_field": "car.created_at",
            "date_from": date_from,
            "date_to": date_to,
            "branch_id": branch_id,
            "summary": summary,
            "by_branch": by_branch,
            "by_source": by_source,
            "by_status": by_status,
        }

    # =====================================================
    # VEHICLE SALES REPORT
    # =====================================================

    @classmethod
    def vehicle_sales_report(
        cls,
        *,
        user,
        date_from,
        date_to,
        branch_id=None,
    ):
        """
        Vehicle sales are derived from SOLD Quotes.

        Quote.updated_at is used because there is no dedicated
        Car.sold_at field in the existing inventory model.
        """

        start_dt, end_dt = cls.datetime_range(
            date_from,
            date_to,
        )

        queryset = Quote.objects.filter(
            status=Quote.Status.SOLD,
            updated_at__gte=start_dt,
            updated_at__lt=end_dt,
            car__isnull=False,
        )

        queryset = cls.apply_sales_staff_scope(
            queryset,
            user,
            ["salesperson"],
        )

        queryset = cls.branch_filter(
            queryset,
            branch_id,
            "car__branch_id",
        )

        summary = queryset.aggregate(
            vehicles_sold=Count("id"),
            total_sales_value=Sum("price"),
            average_sale_value=Avg("price"),
        )

        by_branch = list(
            queryset
            .values("car__branch_id")
            .annotate(
                count=Count("id"),
                total_value=Sum("price"),
            )
            .order_by("-count")
        )

        by_payment_method = list(
            queryset
            .values("payment_method")
            .annotate(
                count=Count("id"),
                total_value=Sum("price"),
            )
            .order_by("payment_method")
        )

        by_salesperson = list(
            queryset
            .values("salesperson_id")
            .annotate(
                count=Count("id"),
                total_value=Sum("price"),
            )
            .order_by("-count")
        )

        return {
            "report": "vehicle-sales",
            "date_field": "quote.updated_at",
            "date_field_note": (
                "Quote.updated_at is used because the existing "
                "inventory model has no dedicated sold_at field."
            ),
            "date_from": date_from,
            "date_to": date_to,
            "branch_id": branch_id,
            "summary": summary,
            "by_branch": by_branch,
            "by_payment_method": by_payment_method,
            "by_salesperson": by_salesperson,
        }

    # =====================================================
    # OPERATIONAL PERFORMANCE REPORT
    # =====================================================

    @classmethod
    def operational_performance_report(
        cls,
        *,
        user,
        date_from,
        date_to,
        branch_id=None,
    ):
        """
        Progression is the authoritative workflow source.

        The report covers:
        - Progressions created during the period
        - Current status distribution
        - Current stage distribution
        - Progressions completed during the period
        """

        start_dt, end_dt = cls.datetime_range(
            date_from,
            date_to,
        )

        queryset = Progression.objects.all()

        queryset = cls.apply_sales_staff_scope(
            queryset,
            user,
            ["quote__salesperson"],
        )

        queryset = cls.branch_filter(
            queryset,
            branch_id,
            "quote__car__branch_id",
        )

        created_queryset = queryset.filter(
            created_at__gte=start_dt,
            created_at__lt=end_dt,
        )

        completed_queryset = queryset.filter(
            completed_at__gte=start_dt,
            completed_at__lt=end_dt,
        )

        created_summary = created_queryset.aggregate(
            progressions_created=Count("id"),
        )

        completed_summary = completed_queryset.aggregate(
            progressions_completed=Count("id"),
        )

        status_breakdown = list(
            created_queryset
            .values("status")
            .annotate(
                count=Count("id"),
            )
            .order_by("status")
        )

        stage_breakdown = list(
            created_queryset
            .values("current_stage")
            .annotate(
                count=Count("id"),
            )
            .order_by("current_stage")
        )

        source_breakdown = list(
            created_queryset
            .values("source_type")
            .annotate(
                count=Count("id"),
            )
            .order_by("source_type")
        )

        registration_emirate_breakdown = list(
            created_queryset
            .values("registration_emirate")
            .annotate(
                count=Count("id"),
            )
            .order_by("registration_emirate")
        )

        return {
            "report": "operational-performance",
            "created_date_field": "progression.created_at",
            "completed_date_field": (
                "progression.completed_at"
            ),
            "date_from": date_from,
            "date_to": date_to,
            "branch_id": branch_id,
            "created": {
                "summary": created_summary,
                "by_status": status_breakdown,
                "by_stage": stage_breakdown,
                "by_source_type": source_breakdown,
                "by_registration_emirate": (
                    registration_emirate_breakdown
                ),
            },
            "completed": completed_summary,
        }

    # =====================================================
    # MASTER DISPATCH
    # =====================================================

    @classmethod
    def generate(
        cls,
        *,
        report,
        user,
        date_from,
        date_to,
        branch_id=None,
    ):
        reports = {
            "sales": cls.sales_report,
            "inventory": cls.inventory_report,
            "cash-receipts": cls.cash_receipt_report,
            "finance": cls.finance_report,
            "vehicle-additions": (
                cls.vehicle_addition_report
            ),
            "vehicle-sales": cls.vehicle_sales_report,
            "operational-performance": (
                cls.operational_performance_report
            ),
        }

        service = reports.get(report)

        if service is None:
            raise ValueError(
                f"Unknown report '{report}'."
            )

        return service(
            user=user,
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
        )