from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from config.pagination import StandardResultsSetPagination
from django.shortcuts import get_object_or_404
from .models import Staff, Attendance, Payroll
from .permissions import (
    IsMaster,
    IsMasterOrAdmin,
    IsUserAccessManager,
)
from .selectors import (
    get_staff,
    list_staff,
)
from .serializers import (
    StaffCreateSerializer,
    StaffSerializer,
    StaffUpdateSerializer,
    UserAccessCreateSerializer,
    UserAccessSerializer,
    UserAccessUpdateSerializer,
    StaffPerformanceSerializer,
    AttendanceSerializer,
    AttendanceCreateSerializer,
    AttendanceUpdateSerializer,
    PayrollSerializer,
    PayrollCreateSerializer,
    PayrollUpdateSerializer,
)
from .services import (
    create_staff,
    update_staff,
    deactivate_staff,
    activate_staff,
    create_user_access,
    update_user_access,
    change_user_password,
    deactivate_user,
    activate_user,
    delete_staff,
    get_staff_performance,
    get_user_or_raise,
)



User = get_user_model()


class StaffListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsMaster()]

        return [IsMasterOrAdmin()]

    def get(self, request):
        staff = list_staff(
            status=request.query_params.get(
                "status",
            ),
            job_role=request.query_params.get(
                "job_role",
            ),
            search=request.query_params.get(
                "search",
            ),
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(staff, request, view=self)

        return paginator.get_paginated_response(
            StaffSerializer(page, many=True).data,
        )

    def post(self, request):
        serializer = StaffCreateSerializer(
            data=request.data,
        )
        serializer.is_valid(
            raise_exception=True,
        )

        staff = create_staff(
            **serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": "Staff created successfully.",
                "data": StaffSerializer(
                    staff,
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class StaffDetailView(APIView):
    permission_classes = [IsMaster]

    def get_permissions(self):
        if self.request.method in {
            "PATCH",
            "DELETE",
        }:
            return [IsMaster()]

        return [IsMasterOrAdmin()]

    def get_object(self, pk):
        try:
            return get_staff(pk)
        except Staff.DoesNotExist:
            raise NotFound(
                "Staff not found."
            )

    def get(self, request, pk):
        staff = self.get_object(pk)

        return Response(
            {
                "success": True,
                "data": StaffSerializer(
                    staff,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        staff = self.get_object(pk)

        serializer = StaffUpdateSerializer(
            staff,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(
            raise_exception=True,
        )

        staff = update_staff(
            staff=staff,
            **serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": "Staff updated successfully.",
                "data": StaffSerializer(
                    staff,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        staff = self.get_object(pk)

        deactivate_staff(
            staff=staff,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Staff deactivated successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )


class StaffActivateView(APIView):
    permission_classes = [
        IsMaster,
    ]

    def post(self, request, pk):
        try:
            staff = get_staff(pk)
        except Staff.DoesNotExist:
            raise NotFound(
                "Staff not found."
            )

        activate_staff(
            staff=staff,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Staff activated successfully."
                ),
                "data": StaffSerializer(
                    staff,
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class UserAccessListCreateView(APIView):
    permission_classes = [
        IsUserAccessManager,
    ]

    def get(self, request):
        queryset = (
            User.objects
            .select_related("staff_profile")
            .all()
            .order_by("-created_at")
        )

        search = request.query_params.get(
            "search",
        )

        if search:
            queryset = queryset.filter(
                email__icontains=search,
            ) | queryset.filter(
                first_name__icontains=search,
            ) | queryset.filter(
                last_name__icontains=search,
            )

        role = request.query_params.get(
            "role",
        )

        if role:
            queryset = queryset.filter(
                role=role,
            )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)

        response = paginator.get_paginated_response(
            UserAccessSerializer(page, many=True).data,
        )
        response.status_code = status.HTTP_200_OK
        return response

    def post(self, request):
        serializer = UserAccessCreateSerializer(
            data=request.data,
        )
        serializer.is_valid(
            raise_exception=True,
        )

        data = serializer.validated_data

        user = create_user_access(
            **data,
        )

        return Response(
            {
                "success": True,
                "message": "User created successfully.",
                "data": UserAccessSerializer(
                    user,
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class UserAccessDetailView(APIView):
    permission_classes = [
        IsUserAccessManager,
    ]

    def get_object(self, pk):
        try:
            return User.objects.select_related(
                "staff_profile",
            ).get(pk=pk)
        except User.DoesNotExist:
            raise NotFound(
                "User not found."
            )

    def get(self, request, pk):
        user = self.get_object(pk)

        return Response(
            {
                "success": True,
                "data": UserAccessSerializer(
                    user,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        user = self.get_object(pk)

        serializer = UserAccessUpdateSerializer(
            data=request.data,
            context={
                "user": user,
            },
        )
        serializer.is_valid(
            raise_exception=True,
        )

        user = update_user_access(
            user=user,
            **serializer.validated_data,
        )

        return Response(
            {
                "success": True,
                "message": "User updated successfully.",
                "data": UserAccessSerializer(
                    user,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        user = self.get_object(pk)

        if user.id == request.user.id:
            return Response(
                {
                    "success": False,
                    "message": (
                        "You cannot deactivate your own "
                        "User Access account."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        deactivate_user(
            user=user,
            actor=request.user,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "User deactivated successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )


class UserAccessActivateView(APIView):
    permission_classes = [
        IsUserAccessManager,
    ]

    def post(self, request, pk):
        try:
            user = User.objects.select_related(
                "staff_profile",
            ).get(pk=pk)
        except User.DoesNotExist:
            raise NotFound(
                "User not found."
            )

        activate_user(
            user=user,
        )

        return Response(
            {
                "success": True,
                "message": "User activated successfully.",
                "data": UserAccessSerializer(
                    user,
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class UserAccessPasswordView(APIView):
    permission_classes = [
        IsUserAccessManager,
    ]

    def post(self, request, pk):
        user = get_user_or_raise(pk)

        password = request.data.get(
            "password",
        )

        if not password:
            return Response(
                {
                    "success": False,
                    "message": "Password is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 8:
            return Response(
                {
                    "success": False,
                    "message": (
                        "Password must contain at least "
                        "8 characters."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        change_user_password(
            user=user,
            password=password,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "User password changed successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )
        
class StaffPerformanceView(APIView):
    permission_classes = [IsMasterOrAdmin]

    def get(self, request, pk):
        staff = get_staff(pk=pk)

        performance = get_staff_performance(
            staff=staff,
        )

        serializer = StaffPerformanceSerializer(
            performance,
        )

        return Response(serializer.data)
    
class AttendanceListCreateView(APIView):
    """
    List and create staff attendance records.
    """

    permission_classes = [IsMasterOrAdmin]

    def get(self, request):
        queryset = Attendance.objects.select_related("staff").all()

        staff_id = request.query_params.get("staff")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        status = request.query_params.get("status")

        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)

        if date_from:
            queryset = queryset.filter(
                attendance_date__gte=date_from
            )

        if date_to:
            queryset = queryset.filter(
                attendance_date__lte=date_to
            )

        if status:
            queryset = queryset.filter(status=status)

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(
            AttendanceSerializer(page, many=True).data,
        )

    def post(self, request):
        serializer = AttendanceCreateSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        attendance = serializer.save()

        return Response(
            AttendanceSerializer(attendance).data,
            status=status.HTTP_201_CREATED,
        )


class AttendanceDetailView(APIView):
    """
    Retrieve, update, or delete an attendance record.
    """

    permission_classes = [IsMasterOrAdmin]

    def get_object(self, pk):
        return get_object_or_404(
            Attendance.objects.select_related("staff"),
            pk=pk,
        )

    def get(self, request, pk):
        attendance = self.get_object(pk)

        serializer = AttendanceSerializer(attendance)

        return Response(serializer.data)

    def patch(self, request, pk):
        attendance = self.get_object(pk)

        serializer = AttendanceUpdateSerializer(
            attendance,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        attendance = serializer.save()

        return Response(
            AttendanceSerializer(attendance).data
        )

    def delete(self, request, pk):
        attendance = self.get_object(pk)

        attendance.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class PayrollListCreateView(APIView):
    """
    List and create monthly payroll records.
    """

    permission_classes = [IsMasterOrAdmin]

    def get(self, request):
        queryset = Payroll.objects.select_related("staff").all()

        staff_id = request.query_params.get("staff")
        year = request.query_params.get("year")
        month = request.query_params.get("month")
        payroll_status = request.query_params.get("status")

        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)

        if year:
            queryset = queryset.filter(
                payroll_year=year
            )

        if month:
            queryset = queryset.filter(
                payroll_month=month
            )

        if payroll_status:
            queryset = queryset.filter(
                status=payroll_status
            )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(
            PayrollSerializer(page, many=True).data,
        )

    def post(self, request):
        serializer = PayrollCreateSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        payroll = serializer.save(
            created_by=request.user
        )

        return Response(
            PayrollSerializer(payroll).data,
            status=status.HTTP_201_CREATED,
        )


class PayrollDetailView(APIView):
    """
    Retrieve, update, or delete a payroll record.
    """

    permission_classes = [IsMasterOrAdmin]

    def get_object(self, pk):
        return get_object_or_404(
            Payroll.objects.select_related("staff"),
            pk=pk,
        )

    def get(self, request, pk):
        payroll = self.get_object(pk)

        serializer = PayrollSerializer(payroll)

        return Response(serializer.data)

    def patch(self, request, pk):
        payroll = self.get_object(pk)

        serializer = PayrollUpdateSerializer(
            payroll,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        payroll = serializer.save()

        return Response(
            PayrollSerializer(payroll).data
        )

    def delete(self, request, pk):
        payroll = self.get_object(pk)

        payroll.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )