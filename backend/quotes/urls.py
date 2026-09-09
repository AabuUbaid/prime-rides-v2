from django.urls import path, include

from .views import (
    QuoteDetailView,
    QuoteListCreateView,
    QuotePrintView,
    QuoteProceedToBankLoanView,
    QuoteProceedToCashDealView,

)


urlpatterns = [
    path(
        "",
        QuoteListCreateView.as_view(),
        name="quote-list-create",
    ),

    path(
        "<int:pk>/",
        QuoteDetailView.as_view(),
        name="quote-detail",
    ),
    path(
    "<int:pk>/print/",
    QuotePrintView.as_view(),
    name="quote-print",
),
# -------------------------------------------------
# Downstream workflow
# -------------------------------------------------

path(
    "<int:pk>/proceed-to-bank-loan/",
    QuoteProceedToBankLoanView.as_view(),
    name="quote-proceed-to-bank-loan",
),

path(
    "<int:pk>/proceed-to-cash-deal/",
    QuoteProceedToCashDealView.as_view(),
    name="quote-proceed-to-cash-deal",
),
]