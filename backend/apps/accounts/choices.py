from django.db import models


class RoleChoices(models.TextChoices):
    MASTER = "MASTER", "Master"
    ADMIN = "ADMIN", "Admin"
    SALES = "SALES", "Sales"