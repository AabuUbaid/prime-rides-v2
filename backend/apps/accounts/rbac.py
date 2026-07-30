from django.db import models

from apps.common.models import BaseModel


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