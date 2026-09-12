from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ActiveUserJWTAuthentication(JWTAuthentication):
    """
    JWT authentication that re-checks the user's active status
    on every authenticated request.

    This ensures that deactivating a user immediately removes
    their access even if they still have a valid JWT access token.
    """

    def get_user(self, validated_token):
        user = super().get_user(validated_token)

        if not user.is_active:
            raise AuthenticationFailed(
                "Account is disabled.",
                code="user_inactive",
            )

        return user