from django.db import models



class ActiveManager(models.Manager):
    """
    Returns only active records.
    """ 

    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

    def active(self):
        return self.get_queryset()

    def inactive(self):
        return super().get_queryset().filter(is_active=False)


class AllObjectsManager(models.Manager):
    """
    Returns every record including inactive ones.
    """

    def get_queryset(self):
        return super().get_queryset()

    def active(self):
        return self.get_queryset().filter(is_active=True)

    def inactive(self):
        return self.get_queryset().filter(is_active=False)
