from rest_framework.permissions import BasePermission


class HasPermission(BasePermission):
    """
    Checks if the authenticated user owns the required permission.
    """

    required_permission = None

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        permission = getattr(view, "required_permission", None)

        if permission is None:
            return True

        return request.user.has_permission(permission)