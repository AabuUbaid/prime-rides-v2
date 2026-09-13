from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Staff
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
    StaffPerformanceSerializer
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
    get_staff_performance
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

        return Response(
            {
                "success": True,
                "data": StaffSerializer(
                    staff,
                    many=True,
                ).data,
            },
            status=status.HTTP_200_OK,
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

        return Response(
            {
                "success": True,
                "data": UserAccessSerializer(
                    queryset,
                    many=True,
                ).data,
            },
            status=status.HTTP_200_OK,
        )

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