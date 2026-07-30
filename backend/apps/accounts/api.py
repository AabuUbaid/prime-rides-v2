from rest_framework.viewsets import ModelViewSet

from .models import User
from .serializers import UserSerializer
from .permissions import HasPermission


class UserViewSet(ModelViewSet):

    queryset = User.objects.select_related("role")

    serializer_class = UserSerializer

    permission_classes = [HasPermission]

    required_permission = "accounts.manage_users"