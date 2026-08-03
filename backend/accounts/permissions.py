from rest_framework.permissions import BasePermission


class IsMaster(BasePermission):
    message = "Only Master users can access this resource."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "MASTER"
        ) 