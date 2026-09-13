from rest_framework.permissions import BasePermission


class IsMaster(BasePermission):
    message = "Only Master users can access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "MASTER"
        )


class IsMasterOrAdmin(BasePermission):
    message = "Only Master or Admin users can access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {"MASTER", "ADMIN"}
        )


class IsUserAccessManager(BasePermission):
    message = "Only Master users can manage User Access."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "MASTER"
        )