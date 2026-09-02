from django.urls import path, include

from .views import (
    QuoteDetailView,
    QuoteListCreateView,
    QuotePrintView

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
]