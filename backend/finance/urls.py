from django.urls import path

from .views import (
    BankDetailView,
    BankListCreateView,
    CashReceiptCategoryListView,

    ExpensePresetListCreateView,
    ExpensePresetDetailView,

    InsuranceBandListCreateView,
    InsuranceBandDetailView,

    ServicePackageListCreateView,
    ServicePackageDetailView,

    BankProcessingConfigurationListCreateView,
    BankProcessingConfigurationDetailView,

    EmiCalculateView,
    EmiSheetDetailView,
    EmiSheetListCreateView,
    
    BankLoanCreateView,
    BankLoanDetailView,
    BankLoanStatusUpdateView,
    BankLoanApplicationStatusUpdateView,
    BankLoanApplicationInfoUpdateView,
    BankLoanFinanceUpdateView,
    BankLoanPriorityUpdateView,
    BankLoanFollowUpCreateView,
    BankLoanNewBankView,
    
    CashDealListCreateView,
    CashDealDetailView,
    
    CashReceiptListCreateView,
    CashReceiptDetailView,
    CashReceiptCustomerDealsView,
    CashReceiptReverseView,
    CashReceiptCategoryListView,
    
    BalanceSheetListCreateView,
    BalanceSheetDetailView,
    BalanceSheetCustomerDealsView,
)


urlpatterns = [
    # -------------------------------------------------
    # Banks
    # -------------------------------------------------

    path(
        "banks/",
        BankListCreateView.as_view(),
        name="finance-bank-list-create",
    ),

    path(
        "banks/<int:pk>/",
        BankDetailView.as_view(),
        name="finance-bank-detail",
    ),

    # -------------------------------------------------
    # Expense presets
    # -------------------------------------------------

    path(
        "expense-presets/",
        ExpensePresetListCreateView.as_view(),
        name="finance-expense-preset-list-create",
    ),

    path(
        "expense-presets/<int:pk>/",
        ExpensePresetDetailView.as_view(),
        name="finance-expense-preset-detail",
    ),

    # -------------------------------------------------
    # Insurance bands
    # -------------------------------------------------

    path(
        "insurance-bands/",
        InsuranceBandListCreateView.as_view(),
        name="finance-insurance-band-list-create",
    ),

    path(
        "insurance-bands/<int:pk>/",
        InsuranceBandDetailView.as_view(),
        name="finance-insurance-band-detail",
    ),

    # -------------------------------------------------
    # Service packages
    # -------------------------------------------------

    path(
        "service-packages/",
        ServicePackageListCreateView.as_view(),
        name="finance-service-package-list-create",
    ),

    path(
        "service-packages/<int:pk>/",
        ServicePackageDetailView.as_view(),
        name="finance-service-package-detail",
    ),

    # -------------------------------------------------
    # Bank processing configurations
    # -------------------------------------------------

    path(
        "bank-processing-configurations/",
        BankProcessingConfigurationListCreateView.as_view(),
        name="finance-bank-processing-list-create",
    ),

    path(
        "bank-processing-configurations/<int:pk>/",
        BankProcessingConfigurationDetailView.as_view(),
        name="finance-bank-processing-detail",
    ),
    # -------------------------------------------------
    # EMI calculation
    # -------------------------------------------------

    path(
        "emi/calculate/",
        EmiCalculateView.as_view(),
        name="finance-emi-calculate",
    ),

    # -------------------------------------------------
    # EMI sheets
    # -------------------------------------------------

    path(
        "emi/",
        EmiSheetListCreateView.as_view(),
        name="finance-emi-list-create",
    ),

    path(
        "emi/<int:pk>/",
        EmiSheetDetailView.as_view(),
        name="finance-emi-detail",
    ),
    
    # -------------------------------------------------
    # Bank Loans
    # -------------------------------------------------

    # -------------------------------------------------
    # Bank Loans
    # -------------------------------------------------

    path(
        "bank-loans/",
        BankLoanCreateView.as_view(),
        name="finance-bank-loan-list",
    ),

    path(
        "bank-loans/<int:pk>/",
        BankLoanDetailView.as_view(),
        name="finance-bank-loan-detail",
    ),
    path(
        "bank-loans/<int:pk>/status/",
        BankLoanStatusUpdateView.as_view(),
        name="finance-bank-loan-status-update",
    ),
    
    path(
        "bank-loans/<int:pk>/application-status/",
        BankLoanApplicationStatusUpdateView.as_view(),
        name="finance-bank-loan-application-status-update",
    ),

    path(
        "bank-loans/<int:pk>/finance/",
        BankLoanFinanceUpdateView.as_view(),
        name="finance-bank-loan-finance-update",
    ),

    path(
        "bank-loans/<int:pk>/priority/",
        BankLoanPriorityUpdateView.as_view(),
        name="finance-bank-loan-priority-update",
    ),

    path(
        "bank-loans/<int:pk>/follow-ups/",
        BankLoanFollowUpCreateView.as_view(),
        name="finance-bank-loan-follow-up-create",
    ),

    path(
        "bank-loans/<int:pk>/new-bank/",
        BankLoanNewBankView.as_view(),
        name="finance-bank-loan-new-bank",
    ),
    
    path(
        "bank-loans/<int:pk>/application-info/",
        BankLoanApplicationInfoUpdateView.as_view(),
        name="finance-bank-loan-application-info-update",
    ),
    
    # -------------------------------------------------
    # Cash Deals
    # -------------------------------------------------

    path(
        "cash-deals/",
        CashDealListCreateView.as_view(),
        name="finance-cash-deal-list-create",
    ),

    path(
        "cash-deals/<int:pk>/",
        CashDealDetailView.as_view(),
        name="finance-cash-deal-detail",
    ),
    
    # -------------------------------------------------
    # Cash Receipts
    # -------------------------------------------------

    path(
        "cash-receipts/",
        CashReceiptListCreateView.as_view(),
        name="finance-cash-receipt-list-create",
    ),

    path(
        "cash-receipts/<int:pk>/",
        CashReceiptDetailView.as_view(),
        name="finance-cash-receipt-detail",
    ),

    path(
        "cash-receipts/customers/<int:customer_id>/deals/",
        CashReceiptCustomerDealsView.as_view(),
        name="finance-cash-receipt-customer-deals",
    ),
    
    path(
        "cash-receipts/<int:pk>/reverse/",
        CashReceiptReverseView.as_view(),
        name="finance-cash-receipt-reverse",
    ),
    
    path(
        "cash-receipts/categories/",
        CashReceiptCategoryListView.as_view(),
        name="finance-cash-receipt-categories",
    ),
        # -------------------------------------------------
    # Balance Sheets
    # -------------------------------------------------

    path(
        "balance-sheets/",
        BalanceSheetListCreateView.as_view(),
        name="finance-balance-sheet-list-create",
    ),

    path(
        "balance-sheets/<int:pk>/",
        BalanceSheetDetailView.as_view(),
        name="finance-balance-sheet-detail",
    ),

    path(
        "balance-sheets/customers/<int:customer_id>/deals/",
        BalanceSheetCustomerDealsView.as_view(),
        name="finance-balance-sheet-customer-deals",
    ),
]