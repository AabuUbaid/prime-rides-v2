"""
Ledger Accounts models.

Ledger Accounts is a reporting/derivation layer.
It does not create a second source of truth for financial transactions.

Authoritative financial records remain in:
    - Inventory
    - Quote
    - CashDeal
    - BankLoan
    - CashReceipt
    - BalanceSheet
    - existing finance/vehicle expense records
"""

# No database models are introduced in Stage 1.