from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer
from .serializers import UserSerializer
from .services import AuthService
from .permissions import CanViewInventory



class LoginAPIView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = AuthService.login(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        return Response(
            {
                "access": result["access"],
                "refresh": result["refresh"],
                "user": UserSerializer(result["user"]).data,
            },
            status=status.HTTP_200_OK,
        )


class MeAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        return Response(
            UserSerializer(request.user).data
        )
    
class TestPermissionAPIView(APIView):

    permission_classes = [CanViewInventory]

    def get(self, request):

        return Response(
            {
                "message": "Permission Granted"
            }
        )