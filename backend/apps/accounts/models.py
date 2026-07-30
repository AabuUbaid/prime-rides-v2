from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models

from apps.common.models import BaseModel
from .managers import UserManager



phone_validator = RegexValidator(
    regex=r"^\+?[0-9]{8,15}$",
    message="Enter a valid phone number.",
)

class Permission(BaseModel):
    code = models.CharField(
        max_length=100,
        unique=True,
    )

    name = models.CharField(
        max_length=150,
    )

    class Meta:
        db_table = "permissions"
        ordering = ["code"]

    def __str__(self):
        return self.code


class Role(BaseModel):
    name = models.CharField(
        max_length=50,
        unique=True,
    )

    permissions = models.ManyToManyField(
        Permission,
        blank=True,
        related_name="roles",
    )

    class Meta:
        db_table = "roles"
        ordering = ["name"]

    def __str__(self):
        return self.name
    
class User(BaseModel, AbstractUser):
    username = None

    email = models.EmailField(
        unique=True,
        db_index=True,
    )

    first_name = models.CharField(
        max_length=150,
    )

    last_name = models.CharField(
        max_length=150,
        blank=True,
    )

    phone_number = models.CharField(
        max_length=20,
        blank=True,
        validators=[phone_validator],
    )

    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name="users",
        null=True,
        blank=True,
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"
        ordering = ["first_name"]

    def __str__(self):
        return self.email

    @property
    def permission_codes(self):
        """
        Returns every permission code assigned through the user's role.
        """
        if not self.role:
            return []

        return list(
            self.role.permissions.values_list("code", flat=True)
        )

    def has_permission(self, code: str) -> bool:
        return code in self.permission_codes