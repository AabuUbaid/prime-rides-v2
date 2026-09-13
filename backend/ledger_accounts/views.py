from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LedgerSummarySerializer
from .services import get_ledger_summary


class LedgerSummaryView(APIView):
    """
    Read-only Ledger Accounts summary.

    No financial records are created or modified here.
    """

    def get(self, request):
        summary = get_ledger_summary()

        serializer = LedgerSummarySerializer(summary)

        return Response(serializer.data)