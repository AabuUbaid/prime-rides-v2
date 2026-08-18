from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from .serializers import (
    LoginSerializer,
    CurrentUserSerializer,
)
from .services import AuthService


class LoginAPIView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = AuthService.login(
            serializer.validated_data["email"],
            serializer.validated_data["password"],
        )

        return Response(
            {
                "success": True,
                "message": "Login successful.",
                "data": {
                    "access": result["access"],
                    "refresh": result["refresh"],
                    "user": CurrentUserSerializer(result["user"]).data,
                },
            },
            status=status.HTTP_200_OK,
        )


class RefreshTokenAPIView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = TokenRefreshSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        return Response(
            {
                "success": True,
                "message": "Token refreshed successfully.",
                "data": serializer.validated_data,
            },
            status=status.HTTP_200_OK,
        )


class CurrentUserAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "success": True,
                "data": CurrentUserSerializer(request.user).data,
            }
        )