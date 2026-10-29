from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from inventory.models import ProcurementCheck
from inventory.procurement_views import DMS_SERVICE_SECRET

User = get_user_model()


class ProcurementInspectionSecurityAndLifecycleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.master_user = User.objects.create_user(
            email="master_audit@primerides.ae",
            role="MASTER",
            password="SecurePassword123!",
        )
        self.service_key = DMS_SERVICE_SECRET

    def test_unauthenticated_sale_report_denied(self):
        """
        SECURITY AUDIT: Sale reports must not be exposed to unrestricted public access.
        Anonymous request without X-DMS-SERVICE-KEY or staff auth must return 403.
        """
        response = self.client.get("/api/inventory/sales/public/?chassis_number=ANYCHASSIS")
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_authorized_sale_report_returns_404_when_no_sale_exists(self):
        """
        SECURITY AUDIT: Must not fabricate dummy buyer names ('Verified Showroom Client')
        or fake payment methods when no genuine completed transaction exists.
        """
        response = self.client.get(
            "/api/inventory/sales/public/?chassis_number=NONEXISTENT123",
            HTTP_X_DMS_SERVICE_KEY=self.service_key,
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("No completed sale transaction found", response.data.get("error", ""))

    def test_unauthenticated_procurement_create_denied(self):
        """
        SECURITY AUDIT: Public unauthenticated requests cannot create procurement checks.
        """
        payload = {
            "make": "Toyota",
            "model": "Land Cruiser",
            "model_year": 2024,
            "mileage": 15000,
        }
        response = self.client.post("/api/inventory/procurement-checks/public/", data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_service_key_creates_procurement_check(self):
        """
        Marketplace backend can dispatch procurement check with valid service key.
        """
        payload = {
            "make": "Porsche",
            "model": "Panamera GTS",
            "model_year": 2023,
            "mileage": 12000,
            "colour": "Volcano Grey",
            "marketplace_reference_code": "PR-INS-2026-TEST",
            "condition_notes": "Marketplace Inspection Booking",
        }
        response = self.client.post(
            "/api/inventory/procurement-checks/public/",
            data=payload,
            format="json",
            HTTP_X_DMS_SERVICE_KEY=self.service_key,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["make"], "Porsche")
        self.assertEqual(response.data["marketplace_reference_code"], "PR-INS-2026-TEST")

    def test_unreleased_procurement_check_public_access_denied(self):
        """
        Gate check: Unreleased inspection reports cannot be accessed anonymously.
        """
        check = ProcurementCheck.objects.create(
            make="BMW",
            model="M5",
            model_year=2024,
            checked_by=self.master_user,
            is_released_to_customer=False,
            workflow_state="in_progress",
        )

        # Anonymous request without service key must be denied (403)
        response = self.client.get(f"/api/inventory/procurement-checks/public/{check.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("pending staff review", response.data.get("error", "").lower())

        # Privileged service key request can access it
        priv_response = self.client.get(
            f"/api/inventory/procurement-checks/public/{check.id}/",
            HTTP_X_DMS_SERVICE_KEY=self.service_key,
        )
        self.assertEqual(priv_response.status_code, status.HTTP_200_OK)

    def test_full_procurement_inspection_lifecycle(self):
        """
        Verify end-to-end lifecycle:
        1. Create Check
        2. Assign Inspector
        3. Submit 13-Panel Findings & Score
        4. Master Review & Approval
        5. Release to Customer
        6. Verify Customer / Public Access is Granted
        """
        # 1. Create Check
        check = ProcurementCheck.objects.create(
            make="Mercedes-Benz",
            model="G63 AMG",
            model_year=2023,
            checked_by=self.master_user,
            workflow_state="pending",
        )
        self.assertEqual(check.workflow_state, "pending")
        self.assertFalse(check.is_released_to_customer)

        # 2. Assign Inspector
        assign_res = self.client.post(
            f"/api/inventory/procurement-checks/{check.id}/assign/",
            data={"assigned_inspector": "Eng. Tariq Al-Mansoor"},
            format="json",
            HTTP_X_DMS_SERVICE_KEY=self.service_key,
        )
        self.assertEqual(assign_res.status_code, status.HTTP_200_OK)
        check.refresh_from_db()
        self.assertEqual(check.assigned_inspector, "Eng. Tariq Al-Mansoor")
        self.assertEqual(check.workflow_state, "assigned")

        # 3. Submit 13-panel findings & overall score
        paint_data = {
            "bonnet": {"value": 115, "assessment": "factory_spec", "notes": "OEM coat"},
            "roof": {"value": 110, "assessment": "factory_spec", "notes": "Original"},
            "boot": {"value": 120, "assessment": "factory_spec", "notes": "Factory paint"},
            "front_bumper": {"value": 130, "assessment": "factory_spec", "notes": "No damage"},
            "rear_bumper": {"value": 185, "assessment": "resprayed", "notes": "Minor cosmetic clear coat"},
            "front_left_fender": {"value": 112, "assessment": "factory_spec", "notes": ""},
            "front_left_door": {"value": 118, "assessment": "factory_spec", "notes": ""},
            "rear_left_door": {"value": 115, "assessment": "factory_spec", "notes": ""},
            "rear_left_quarter": {"value": 122, "assessment": "factory_spec", "notes": ""},
            "front_right_fender": {"value": 110, "assessment": "factory_spec", "notes": ""},
            "front_right_door": {"value": 114, "assessment": "factory_spec", "notes": ""},
            "rear_right_door": {"value": 116, "assessment": "factory_spec", "notes": ""},
            "rear_right_quarter": {"value": 119, "assessment": "factory_spec", "notes": ""},
        }
        checkpoints_data = {
            "front_bumper": "pass",
            "bonnet_panel": "pass",
            "engine_oil": "pass",
            "fluid_leaks": "pass",
            "gear_engagement": "pass",
            "front_brakes": "pass",
            "ac_cooling": "pass",
            "front_tyres": "pass",
            "mil_lamp": "pass",
            "chassis_rails": "pass",
            "acceleration": "pass",
        }
        findings_payload = {
            "overall_score": 8.7,
            "paint_thickness_data": paint_data,
            "checkpoints_data": checkpoints_data,
            "inspector_recommendations": "Excellent mechanical and body condition. Ready for showroom certification.",
            "inspection_time": "11:30 AM",
        }
        findings_res = self.client.post(
            f"/api/inventory/procurement-checks/{check.id}/submit-findings/",
            data=findings_payload,
            format="json",
            HTTP_X_DMS_SERVICE_KEY=self.service_key,
        )
        self.assertEqual(findings_res.status_code, status.HTTP_200_OK)
        check.refresh_from_db()
        self.assertEqual(check.overall_score, Decimal("8.7"))
        self.assertEqual(check.workflow_state, "submitted_for_review")
        self.assertEqual(check.paint_thickness_data["bonnet"]["value"], 115)

        # 4. Master Review & Approval
        approve_res = self.client.post(
            f"/api/inventory/procurement-checks/{check.id}/approve/",
            data={},
            format="json",
            HTTP_X_DMS_SERVICE_KEY=self.service_key,
        )
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)
        check.refresh_from_db()
        self.assertTrue(check.is_approved_by_master)
        self.assertEqual(check.workflow_state, "approved")
        self.assertIsNotNone(check.approved_at)

        # 5. Release to Customer
        release_res = self.client.post(
            f"/api/inventory/procurement-checks/{check.id}/release/",
            data={},
            format="json",
            HTTP_X_DMS_SERVICE_KEY=self.service_key,
        )
        self.assertEqual(release_res.status_code, status.HTTP_200_OK)
        check.refresh_from_db()
        self.assertTrue(check.is_released_to_customer)
        self.assertEqual(check.workflow_state, "released")
        self.assertIsNotNone(check.released_at)

        # 6. Verify Customer / Public Access is Granted Now
        public_res = self.client.get(f"/api/inventory/procurement-checks/public/{check.id}/")
        self.assertEqual(public_res.status_code, status.HTTP_200_OK)
        self.assertEqual(public_res.data["overall_score"], "8.7")
        self.assertEqual(public_res.data["workflow_state"], "released")
        self.assertTrue(public_res.data["is_released_to_customer"])
