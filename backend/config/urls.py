from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    path(
        "api/accounts/",
        include("accounts.urls"),
    ),

    path(
        "api/inventory/",
        include("inventory.urls"),
    ),

    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),

    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema",
        ),
        name="swagger-ui",
    ),

    path(
        "api/redoc/",
        SpectacularRedocView.as_view(
            url_name="schema",
        ),
        name="redoc",
    ),

    path(
        "api/finance/",
        include("finance.urls"),
    ),
     path(
        "api/quotes/",
        include("quotes.urls"),
    ),
    path(
        "api/customers/",
        include("customers.urls"),
    ),
    path("api/insurance/", include("insurance.urls")),
    
    path(
        "api/proforma/",
        include("proforma.urls"),
    ),
    path(
        "api/delivery-notes/",
        include("delivery_note.urls"),
    ),
    path(
        "api/staff/",
        include("staff.urls"),
    ),
    path(
        "api/leads/",
        include("leads.urls"),
    ),
    path(
        "api/progression/",
        include("progression.urls"),
    ),
    path(
        "api/ledger-accounts/",
        include("ledger_accounts.urls"),
    ),
    path(
        "api/company/",
        include("company.urls"),
    ),
    path("api/rta/", include("rta.urls")),
    
    path("api/reports/", include("reports.urls")),
    
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
