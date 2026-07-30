from django.urls import path

from apps.crm import views

urlpatterns = [
    path("customers/", views.CustomerListCreateAPIView.as_view(), name="customer-list"),
    path(
        "customers/<uuid:customer_id>/",
        views.CustomerDetailAPIView.as_view(),
        name="customer-detail",
    ),
    path("leads/", views.LeadListCreateAPIView.as_view(), name="lead-list"),
    path(
        "leads/<uuid:lead_id>/",
        views.LeadDetailAPIView.as_view(),
        name="lead-detail",
    ),
    path(
        "leads/<uuid:lead_id>/status/",
        views.LeadStatusAPIView.as_view(),
        name="lead-status",
    ),
]
