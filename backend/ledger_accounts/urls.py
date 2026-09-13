from django.urls import path

from .views import LedgerSummaryView


urlpatterns = [
    path(
        "summary/",
        LedgerSummaryView.as_view(),
        name="ledger-summary",
    ),
]