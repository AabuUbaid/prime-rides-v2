from django.db import models


class CustomerQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def assigned_to(self, user):
        return self.filter(assigned_to=user)


class CustomerManager(models.Manager.from_queryset(CustomerQuerySet)):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)


class LeadQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def open(self):
        return self.exclude(status__in=["WON", "LOST"])

    def assigned_to(self, user):
        return self.filter(assigned_to=user)


class LeadManager(models.Manager.from_queryset(LeadQuerySet)):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)
