# Backend API and Architecture Report

**Audit scope:** Django backend under `backend/`, audited 2026-09-27. This is a source-based inspection; no source code was modified and no test suite was run. Route methods below are implemented application methods. DRF also exposes `OPTIONS`; `HEAD` follows `GET` where applicable. Inherited generic-view methods are included where relevant.

## Executive Summary

The backend is a Django REST Framework API for a vehicle dealer management system. Root routing registers 15 application namespaces and 124 app route patterns, plus Django admin, an OpenAPI schema, Swagger UI, and ReDoc. Requests default to active-user JWT authentication and `IsAuthenticated`, with app views adding role checks, ownership filtering, or method-specific permissions.

The main workflow is vehicle inventory and customer/lead management into quotes, financing or cash deals, insurance, proforma/delivery documents, progression/registration and RTA. Finance also exposes receipts, balance sheets, EMI tools and reporting. Most API domains use explicit `path()` declarations rather than routers.

Primary API/source references: [`config/urls.py`](config/urls.py), [`config/settings.py`](config/settings.py), and each app's `urls.py`, `views.py`, `serializers.py`, `services.py`, `selectors.py`, and `models.py`.

## Root Routes

Declared in [`config/urls.py`](config/urls.py):

| Route | Purpose |
|---|---|
| `/admin/` | Django admin site. |
| `/api/schema/` | Runtime-generated OpenAPI schema (drf-spectacular). |
| `/api/docs/` | Swagger UI, resolving the schema by URL name. |
| `/api/redoc/` | ReDoc, resolving the same schema. |
| `/api/accounts/` | Authentication and current-user endpoints. |
| `/api/inventory/` | Vehicle, image, expense, document, demand and procurement endpoints. |
| `/api/finance/` | Finance configuration, EMI, loans, deals, receipts and balance sheets. |
| `/api/quotes/` | Quote CRUD, print and downstream conversion. |
| `/api/customers/` | Customer CRUD, import and documents. |
| `/api/insurance/` | Insurance records and renewal workflow. |
| `/api/proforma/` | Proforma records. |
| `/api/delivery-notes/` | Delivery-note records. |
| `/api/staff/` | Staff, user access, attendance and payroll. |
| `/api/leads/` | Lead management and activities. |
| `/api/progression/` | Deal progression and registration documents. |
| `/api/ledger-accounts/` | Ledger summary. |
| `/api/company/` | Company, branch and company-document records. |
| `/api/rta/` | RTA records and uploaded/generated documents. |
| `/api/reports/` | Sales, inventory, finance and operational reports. |

No static or media URL patterns are appended in the root URLConf, even though `STATIC_URL`, `STATIC_ROOT`, `MEDIA_URL`, and `MEDIA_ROOT` are configured. Production deployment may serve those paths through another layer, but that is not established by this Django URL configuration.

## Authentication and Permission Key

Global DRF configuration in [`config/settings.py`](config/settings.py): `ActiveUserJWTAuthentication` is the only configured authentication class and `IsAuthenticated` is the default permission. The custom JWT auth class rechecks that a user remains active. JWT access tokens last 30 minutes and refresh tokens 7 days; refresh rotation and blacklist-after-rotation are enabled. Bearer is the accepted authorization header type.

The route table uses these permission abbreviations:

- `Any`: `AllowAny` (still subject to configured authentication processing where applicable).
- `Auth`: authenticated user; usually explicit `IsAuthenticated` or inherited default.
- `Master`: `IsMaster`.
- `Master/Admin`: `IsMasterOrAdmin`.
- `User-access manager`: `IsUserAccessManager`.
- `Auth + Master`: declared authentication and Master checks; handler may further narrow behavior.
- Method-specific rules are stated separately where a view changes permissions by HTTP method.

Sales Staff scoping and ownership checks often happen in selectors or handlers and are not equivalent to a role-wide permission class. Where the source shows a discrepancy, it is called out in the findings below.

## Complete App Route Inventory

### Accounts
Source: [`accounts/urls.py`](accounts/urls.py), [`accounts/views.py`](accounts/views.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/accounts/login/` | POST | `LoginAPIView` | `AllowAny`; validates credentials and issues tokens. |
| `/api/accounts/refresh/` | POST | `RefreshTokenAPIView` | `AllowAny`; refreshes/rotates tokens per JWT settings. |
| `/api/accounts/me/` | GET | `CurrentUserAPIView` | Auth; returns the current authenticated user's representation. |

### Inventory
Sources: [`inventory/urls.py`](inventory/urls.py), [`inventory/views.py`](inventory/views.py), [`inventory/car_demand_views.py`](inventory/car_demand_views.py), [`inventory/procurement_views.py`](inventory/procurement_views.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/inventory/cars/` | GET, POST | `CarAPIView` | Auth; list/create vehicles; list query and response use inventory serializers/selectors. |
| `/api/inventory/cars/brands/` | GET | `CarBrandListAPIView` | Auth; brand options. |
| `/api/inventory/cars/print/` | GET | `CarPrintAPIView` | Auth; printable vehicle listing; `public_stock` changes serialized output, not access. |
| `/api/inventory/cars/<uuid:car_id>/` | GET, PUT, PATCH, DELETE | `CarDetailAPIView` | Auth; vehicle detail/update/delete. |
| `/api/inventory/cars/delete-all/` | DELETE | `DeleteAllInventoryCarsAPIView` | Auth + Master. |
| `/api/inventory/cars/import/` | POST | `BulkVehicleImportAPIView` | Auth; bulk vehicle import. |
| `/api/inventory/cars/<uuid:car_id>/expenses/` | GET, POST | `CarExpenseAPIView` | Auth; list/create vehicle expenses. |
| `/api/inventory/expenses/<int:expense_id>/` | PATCH, DELETE | `CarExpenseDetailAPIView` | Auth; edit/delete an expense. |
| `/api/inventory/images/<int:image_id>/cover/` | PATCH | `CarImageCoverAPIView` | Auth; mark image as cover. |
| `/api/inventory/images/<int:image_id>/` | DELETE | `CarImageAPIView` | Auth; delete an image. |
| `/api/inventory/cars/<uuid:car_id>/images/reorder/` | PATCH | `CarImageReorderAPIView` | Auth; update image ordering. |
| `/api/inventory/images/bulk-delete/` | POST | `BulkImageDeleteAPIView` | Auth; bulk image deletion. |
| `/api/inventory/cars/bulk/` | DELETE | `BulkVehicleDeleteAPIView` | Auth; bulk vehicle deletion. |
| `/api/inventory/dashboard/` | GET | `DashboardAPIView` | Auth; inventory dashboard aggregate. |
| `/api/inventory/special-price/` | GET | `SpecialPriceRequestListAPIView` | Auth; non-Master results are requester-scoped. |
| `/api/inventory/special-price/request/` | POST | `SpecialPriceRequestAPIView` | Auth; request attributed to caller. |
| `/api/inventory/special-price/<int:pk>/decision/` | POST | `SpecialPriceDecisionAPIView` | Master. |
| `/api/inventory/cars/<uuid:car_id>/documents/` | GET, POST | `VehicleDocumentAPIView` | Auth; archived documents hidden from non-Masters. |
| `/api/inventory/documents/<uuid:document_id>/download/` | GET | `VehicleDocumentDownloadAPIView` | Auth; archived documents are Master-only. |
| `/api/inventory/documents/<uuid:document_id>/delete/` | DELETE | `VehicleDocumentDeleteAPIView` | Auth; Master may delete any; others only their own non-archived uploads within 24 hours. |
| `/api/inventory/documents/<uuid:document_id>/archive/` | POST | `VehicleDocumentArchiveAPIView` | Auth; handler requires Master. |
| `/api/inventory/car-demands/` | GET, POST | `CarDemandListCreateAPIView` | Auth; Master sees all, other users see demands they created. |
| `/api/inventory/car-demands/<uuid:demand_id>/` | GET, PATCH, DELETE | `CarDemandDetailAPIView` | Auth; Master, creator or assigned agent can manage. |
| `/api/inventory/car-demands/<uuid:demand_id>/matches/` | GET | `CarDemandMatchesAPIView` | Auth; per-demand access check. |
| `/api/inventory/car-demands/<uuid:demand_id>/link/` | POST | `CarDemandLinkVehicleAPIView` | Auth; per-demand access check, links a vehicle. |
| `/api/inventory/car-demands/<uuid:demand_id>/unlink/` | POST | `CarDemandUnlinkVehicleAPIView` | Auth; per-demand access check, unlinks a vehicle. |
| `/api/inventory/procurement-checks/` | GET, POST | `ProcurementCheckListCreateView` | Auth; list/create procurement checks. |
| `/api/inventory/procurement-checks/<int:pk>/` | GET, PATCH, DELETE | `ProcurementCheckDetailView` | Auth; delete handler requires Master; PATCH has no additional role check in the audited handler. |

Principal models include `Car`, `CarImage`, `CarExpense`, `VehicleDocument`, `CarDemand`, special-price request records and `ProcurementCheck`. Main service boundaries include `InventorySelector`/`InventoryService`, demand matching, procurement and special-price services. Several destructive inventory mutations are authenticated-only at the view permission layer; see findings.

### Finance
Sources: [`finance/urls.py`](finance/urls.py), [`finance/views.py`](finance/views.py), finance serializers/services/selectors/models.

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/finance/banks/` | GET, POST | `BankListCreateView` | GET Auth (inactive banks hidden from non-Masters); POST Master. |
| `/api/finance/banks/<int:pk>/` | PATCH | `BankDetailView` | Master. |
| `/api/finance/expense-presets/` | GET, POST | `ExpensePresetListCreateView` | GET Auth; POST Master. |
| `/api/finance/expense-presets/<int:pk>/` | GET, PUT, PATCH, DELETE | `ExpensePresetDetailView` | Master; standard retrieve/update/destroy behavior. |
| `/api/finance/insurance-bands/` | GET, POST | `InsuranceBandListCreateView` | GET Auth; POST Master. |
| `/api/finance/insurance-bands/<int:pk>/` | GET, PUT, PATCH, DELETE | `InsuranceBandDetailView` | Master. |
| `/api/finance/service-packages/` | GET, POST | `ServicePackageListCreateView` | GET Auth; POST Master. |
| `/api/finance/service-packages/<int:pk>/` | GET, PUT, PATCH, DELETE | `ServicePackageDetailView` | Master. |
| `/api/finance/bank-processing-configurations/` | GET, POST | `BankProcessingConfigurationListCreateView` | GET Auth; POST Master. |
| `/api/finance/bank-processing-configurations/<int:pk>/` | GET, PUT, PATCH, DELETE | `BankProcessingConfigurationDetailView` | Master. |
| `/api/finance/emi/calculate/` | POST | `EmiCalculateView` | Auth; only Master may provide a custom interest rate. |
| `/api/finance/emi/` | GET, POST | `EmiSheetListCreateView` | Auth; Sales Staff list is limited to sheets they created; custom interest rate is Master-only. |
| `/api/finance/emi/<int:pk>/` | GET, PATCH, DELETE | `EmiSheetDetailView` | Auth; Sales Staff may GET/PATCH only their own; DELETE handler requires Master. |
| `/api/finance/bank-loans/` | GET, POST | `BankLoanCreateView` | Master for both methods. Routed class is named CreateView though it also implements GET. |
| `/api/finance/bank-loans/<int:pk>/` | GET | `BankLoanDetailView` | Auth; no owner filter identified. |
| `/api/finance/bank-loans/<int:pk>/status/` | PATCH | `BankLoanStatusUpdateView` | Master. |
| `/api/finance/bank-loans/<int:pk>/application-status/` | PATCH | `BankLoanApplicationStatusUpdateView` | Master. |
| `/api/finance/bank-loans/<int:pk>/finance/` | PATCH | `BankLoanFinanceUpdateView` | Master. |
| `/api/finance/bank-loans/<int:pk>/priority/` | PATCH | `BankLoanPriorityUpdateView` | Master. |
| `/api/finance/bank-loans/<int:pk>/follow-ups/` | GET, POST | `BankLoanFollowUpCreateView` | Master. |
| `/api/finance/bank-loans/<int:pk>/new-bank/` | POST | `BankLoanNewBankView` | Master. |
| `/api/finance/bank-loans/<int:pk>/application-info/` | PATCH | `BankLoanApplicationInfoUpdateView` | Master. |
| `/api/finance/cash-deals/` | GET, POST | `CashDealListCreateView` | Master. |
| `/api/finance/cash-deals/<int:pk>/` | GET, PATCH | `CashDealDetailView` | Master. |
| `/api/finance/cash-receipts/` | GET, POST | `CashReceiptListCreateView` | Master/Admin. |
| `/api/finance/cash-receipts/<int:pk>/` | GET, PATCH | `CashReceiptDetailView` | Master/Admin. |
| `/api/finance/cash-receipts/customers/<int:customer_id>/deals/` | GET | `CashReceiptCustomerDealsView` | Master/Admin. |
| `/api/finance/cash-receipts/<int:pk>/reverse/` | POST | `CashReceiptReverseView` | Master/Admin; reverses a receipt via finance logic. |
| `/api/finance/cash-receipts/categories/` | GET | `CashReceiptCategoryListView` | Master/Admin. |
| `/api/finance/balance-sheets/` | GET, POST | `BalanceSheetListCreateView` | Master/Admin. |
| `/api/finance/balance-sheets/<int:pk>/` | GET, PATCH, DELETE | `BalanceSheetDetailView` | Base Master/Admin; PATCH and DELETE handlers additionally require Master. |
| `/api/finance/balance-sheets/customers/<int:customer_id>/deals/` | GET | `BalanceSheetCustomerDealsView` | Master/Admin. |

Finance models cover banks/configuration, EMI sheets and expenses, bank loans/follow-ups, cash deals/receipts and balance sheets. Services/selectors handle EMI calculations and persistence, loan/deal workflows, receipt transactions and balance-sheet operations.

### Quotes
Sources: [`quotes/urls.py`](quotes/urls.py), [`quotes/views.py`](quotes/views.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/quotes/` | GET, POST | `QuoteListCreateView` | Auth; Sales Staff list is scoped to their own quotes. |
| `/api/quotes/<int:pk>/` | GET, PATCH, DELETE | `QuoteDetailView` | Auth; delete handler requires Master. Detail GET/PATCH do not pass user to the optional owner check. |
| `/api/quotes/<int:pk>/print/` | GET | `QuotePrintView` | Auth; no Sales Staff ownership check identified. |
| `/api/quotes/<int:pk>/proceed-to-bank-loan/` | POST | `QuoteProceedToBankLoanView` | Auth; explicitly blocks Sales Staff; creates downstream loan workflow. |
| `/api/quotes/<int:pk>/proceed-to-cash-deal/` | POST | `QuoteProceedToCashDealView` | Auth; explicitly blocks Sales Staff; creates downstream cash workflow. |

Quote domain includes `Quote` and `QuoteExpense`, numbering/snapshot logic, selectors and conversion services linking vehicles, EMI, bank loans and cash deals.

### Customers
Sources: [`customers/urls.py`](customers/urls.py), [`customers/views.py`](customers/views.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/customers/` | GET, POST | `CustomerListCreateView` | Auth. |
| `/api/customers/import/` | POST | `CustomerCSVImportView` | Auth; CSV import service. |
| `/api/customers/<int:pk>/` | GET, PATCH, DELETE | `CustomerDetailView` | Auth. |
| `/api/customers/<int:pk>/documents/` | GET, POST | `CustomerDocumentListCreateView` | Auth. |
| `/api/customers/<int:customer_pk>/documents/<int:pk>/` | DELETE | `CustomerDocumentDetailView` | Auth; document lookup is scoped to the specified customer. |

Models include `Customer` and `CustomerDocument`; selectors and services support customer/document workflows and imports.

### Insurance
Sources: [`insurance/urls.py`](insurance/urls.py), [`insurance/views.py`](insurance/views.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/insurance/` | GET | `InsuranceListAPIView` | Master/Admin. |
| `/api/insurance/quotes/<int:quote_id>/create/` | POST | `InsuranceCreateAPIView` | Master/Admin; creates insurance associated with quote/deal. |
| `/api/insurance/<int:pk>/` | GET | `InsuranceDetailAPIView` | Master/Admin. |
| `/api/insurance/<int:pk>/status/` | PATCH | `InsuranceStatusUpdateAPIView` | Master/Admin. |
| `/api/insurance/<int:pk>/renewal/start/` | POST | `InsuranceRenewalStartAPIView` | Master/Admin. |
| `/api/insurance/<int:pk>/renewal/status/` | PATCH | `InsuranceRenewalStatusUpdateAPIView` | Master/Admin. |
| `/api/insurance/<int:pk>/renewal/approve/` | POST | `InsuranceRenewalApproveAPIView` | Master/Admin. |

Insurance records/policies link to quotes and finance deals. Services implement status and renewal operations.

### Proforma and Delivery Notes
Sources: [`proforma/urls.py`](proforma/urls.py), [`proforma/views.py`](proforma/views.py), [`delivery_note/urls.py`](delivery_note/urls.py), [`delivery_note/views.py`](delivery_note/views.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/proforma/` | GET, POST | `ProformaListCreateAPIView` | Master/Admin; creation workflow enforces insurance approval and one document per deal. |
| `/api/proforma/<int:pk>/` | GET, PATCH, DELETE | `ProformaDetailAPIView` | Master/Admin; delete additionally checks Master. |
| `/api/delivery-notes/` | GET, POST | `DeliveryNoteListCreateAPIView` | Master/Admin; creation workflow enforces insurance approval and one document per deal. |
| `/api/delivery-notes/<int:pk>/` | GET, PATCH, DELETE | `DeliveryNoteDetailAPIView` | Master/Admin; delete additionally checks Master. |

Each domain has its own document model, serializer and create/update services; workflows relate documents to insurance and quotes/deals.

### Staff
Sources: [`staff/urls.py`](staff/urls.py), [`staff/views.py`](staff/views.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/staff/` | GET, POST | `StaffListCreateView` | GET Master/Admin; POST Master. |
| `/api/staff/<int:pk>/` | GET, PATCH, DELETE | `StaffDetailView` | GET Master/Admin; PATCH/DELETE Master. |
| `/api/staff/<int:pk>/activate/` | POST | `StaffActivateView` | Master. |
| `/api/staff/user-access/` | GET, POST | `UserAccessListCreateView` | User-access manager. |
| `/api/staff/user-access/<uuid:pk>/` | GET, PATCH, DELETE | `UserAccessDetailView` | User-access manager; handler prevents self-deactivation. |
| `/api/staff/user-access/<uuid:pk>/activate/` | POST | `UserAccessActivateView` | User-access manager. |
| `/api/staff/user-access/<uuid:pk>/password/` | POST | `UserAccessPasswordView` | User-access manager. |
| `/api/staff/<int:pk>/performance/` | GET | `StaffPerformanceView` | Master/Admin. |
| `/api/staff/attendance/` | GET, POST | `AttendanceListCreateView` | Master/Admin. |
| `/api/staff/attendance/<int:pk>/` | GET, PATCH, DELETE | `AttendanceDetailView` | Master/Admin. |
| `/api/staff/payroll/` | GET, POST | `PayrollListCreateView` | Master/Admin. |
| `/api/staff/payroll/<int:pk>/` | GET, PATCH, DELETE | `PayrollDetailView` | Master/Admin. |

Models include staff, attendance and payroll data, alongside user accounts. Services/selectors support access administration and performance.

### Leads
Sources: [`leads/urls.py`](leads/urls.py), [`leads/views.py`](leads/views.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/leads/` | GET, POST | `LeadListCreateView` | Auth; Sales Staff list assigned leads and are assigned their own lead on creation. |
| `/api/leads/<int:pk>/` | GET, PATCH, DELETE | `LeadDetailView` | Auth; Sales Staff lookup is assignment-scoped; edits use `can_manage_lead`; Sales Staff cannot reassign; delete Master-only. |
| `/api/leads/<int:pk>/activities/` | POST | `LeadActivityCreateView` | Auth; lead access and `can_manage_lead` checks. |

Domain models include leads, activities and assignment history; selectors/services implement assignment and access behavior.

### Progression
Sources: [`progression/urls.py`](progression/urls.py), [`progression/views.py`](progression/views.py), [`progression/services.py`](progression/services.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/progression/` | GET | `ProgressionListView` | Auth; Sales Staff list scoped to their quotes. |
| `/api/progression/<int:pk>/` | GET, PATCH | `ProgressionDetailView` | Auth; GET is user-scoped; PATCH handler requires Master/Admin. |
| `/api/progression/<int:pk>/advance/` | POST | `ProgressionAdvanceView` | Auth; handler requires Master/Admin; balance-gate override is Master-only and requires a reason. |
| `/api/progression/<int:pk>/registration-documents/` | GET | `RegistrationDocumentsView` | Auth; handler fetches by progression ID without user-scoped selector. |
| `/api/progression/<int:pk>/registration-documents/<str:source>/<str:document_id>/download/` | GET | `RegistrationDocumentDownloadView` | Auth; uses user-scoped progression lookup and ties document lookup to quote. |

Progression/stage synchronization and advancement are service-owned; document listing/downloads aggregate customer and vehicle documents.

### Ledger Accounts
Sources: [`ledger_accounts/urls.py`](ledger_accounts/urls.py), [`ledger_accounts/views.py`](ledger_accounts/views.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/ledger-accounts/summary/` | GET | `LedgerSummaryView` | Inherits global Auth; read-only summary aggregates finance, inventory, quote and progression records. |

No app-owned model class was identified; aggregation is service-based.

### Company
Sources: [`company/urls.py`](company/urls.py), [`company/views.py`](company/views.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/company/` | GET, POST | `CompanyListCreateView` | Auth + Master; POST is implemented but returns 400 because additional companies are disallowed. |
| `/api/company/<int:pk>/` | GET, PATCH | `CompanyDetailView` | Auth + Master; handler uses first company and ignores URL `pk`. |
| `/api/company/branches/` | GET, POST | `CompanyBranchListCreateView` | Auth + Master. |
| `/api/company/branches/<int:pk>/` | GET, PATCH | `CompanyBranchDetailView` | Auth + Master. |
| `/api/company/documents/` | GET, POST | `CompanyDocumentListCreateView` | Auth + Master. |
| `/api/company/documents/<int:document_id>/` | GET, PATCH, DELETE | `CompanyDocumentDetailView` | Auth + Master; document is scoped to the first company. |

Models cover `Company`, `CompanyBranch` and company documents.

### RTA
Sources: [`rta/urls.py`](rta/urls.py), [`rta/views.py`](rta/views.py).

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/rta/` | GET, POST | `RTARecordListCreateView` | Auth; standard ListCreate handlers. |
| `/api/rta/<int:pk>/generated-document/` | GET | `RTAGeneratedDocumentView` | Auth + Master/Admin. |
| `/api/rta/<int:pk>/` | GET, PUT, PATCH | `RTAMasterUpdateView` | Auth + Master/Admin; RetrieveUpdate behavior. |
| `/api/rta/<int:rta_record_id>/documents/` | GET, POST | `RTADocumentListCreateView` | Auth + Master/Admin; documents scoped to parent record. |
| `/api/rta/documents/<uuid:pk>/download/` | GET | `RTADocumentDownloadView` | Auth + Master/Admin. |
| `/api/rta/documents/<uuid:pk>/delete/` | DELETE | `RTADocumentDeleteView` | Auth + Master/Admin. |

Models include `RTARecord` and `RTADocument`; services handle record creation and generated documents.

### Reports
Sources: [`reports/urls.py`](reports/urls.py), [`reports/views.py`](reports/views.py), `ReportService`.

| Exact route | Methods | Handler | Access / behavior |
|---|---|---|---|
| `/api/reports/sales/` | GET | `SalesReportView` | Auth; report service scopes Sales Staff data. |
| `/api/reports/inventory/` | GET | `InventoryReportView` | Auth; report service scopes Sales Staff data. |
| `/api/reports/cash-receipts/` | GET | `CashReceiptReportView` | Auth; report service scopes Sales Staff data. |
| `/api/reports/finance/` | GET | `FinanceReportView` | Auth; report service scopes Sales Staff data. |
| `/api/reports/vehicle-additions/` | GET | `VehicleAdditionReportView` | Auth; report service scopes Sales Staff data. |
| `/api/reports/vehicle-sales/` | GET | `VehicleSalesReportView` | Auth; report service scopes Sales Staff data. |
| `/api/reports/operational-performance/` | GET | `OperationalPerformanceReportView` | Auth; report service scopes Sales Staff data. |

Reports are aggregate/read-only endpoints; no app-owned report model was identified.

## Request/Response and Operational Conventions

- Request/response contracts are defined by app serializers and, where used, query serializers. The OpenAPI schema is generated at runtime by drf-spectacular; Swagger UI and ReDoc consume that schema. For a concrete field-by-field payload contract, use `/api/schema/` or inspect the named serializer in the endpoint's app.
- Pagination is not globally configured. Views opt into `StandardResultsSetPagination`, which defaults to 25 results and allows a `page_size` up to 100; car demands use a separate 10-item paginator. Do not assume every list is paginated.
- The custom exception handler wraps framework errors in a `{success, message, errors}` envelope. Individual services may raise domain exceptions that are mapped through this handler.
- Database settings parse `DATABASE_URL`, use 600-second connection reuse, and require SSL. The custom user model is `accounts.User`; timezone is UTC.
- CORS allows a defined set of localhost/LAN development origins and two HTTPS origins. This is a source configuration snapshot, not confirmation of deployed environment values.

## Models and Service Domains

| App | Main domain |
|---|---|
| Accounts | Custom user/role model, user manager, JWT authentication and role permissions. |
| Inventory | Cars, images, expenses, vehicle documents, demand matching, special-price requests and procurement checks; inventory, matching, procurement and pricing services. |
| Finance | Banks/configuration, EMI sheets/expenses, loans/follow-ups, cash deals/receipts and balance sheets; calculation, selection and transaction services. |
| Quotes | Quotes and quote expenses; numbering, snapshots, selectors and conversion services. |
| Customers | Customers and customer documents; CRUD, CSV import and document services. |
| Insurance | Insurance/policy records; create, status, renewal and approval services. |
| Proforma | Proforma records and document workflow. |
| Delivery Note | Delivery-note records and document workflow. |
| Staff | Staff, access, attendance, payroll and performance. |
| Leads | Leads, activities and assignment history; ownership and access services. |
| Progression | Progression/stage state and override audit records; advancement and registration-document services. |
| Ledger Accounts | Read-only ledger aggregation; no app-owned model found. |
| Company | Company, branch and company-document records. |
| RTA | RTA records and documents; generated-document service. |
| Reports | Cross-domain aggregates in `ReportService`; no app-owned report model found. |

## Settings, Dependencies, and Deployment Notes

- Installed components include Django admin/auth/session/static, DRF, CORS headers, SimpleJWT blacklist, drf-spectacular and its sidecar, and the 15 domain apps.
- `DEBUG` defaults to `True` if the environment variable is missing. Production must explicitly set it to false. `SECRET_KEY` and `DATABASE_URL` are required configuration inputs.
- `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` are explicit allowlists in settings.
- `MEDIA_URL` is `/media/`; `STATIC_URL` is `static/`. URLConf does not append media/static serving patterns. WhiteNoise is in requirements but is not in the shown middleware list.
- `requirements.txt` has repeated pinned dependency entries, includes both `psycopg2-binary` and `psycopg`/`psycopg[binary]`, and pins Django 6.0.7 while the generated settings header refers to Django 5.1.4. This is a repository consistency/provenance observation, not a runtime incompatibility determination.

## Tests and Coverage

Substantive checked-in tests are concentrated in [`finance/tests.py`](finance/tests.py) and [`quotes/tests.py`](quotes/tests.py). Finance tests cover bank constraints/deletion protection, EMI input/tenure validation, master-derived expenses, EMI arithmetic and saved snapshots. Quote tests cover source requirements, snapshots and numbering, selectors/search/status, quote API authentication/create/read, protected update fields and role-based deletion.

The other 13 app `tests.py` files are placeholders: accounts, company, customers, delivery_note, insurance, inventory, leads, ledger_accounts, proforma, progression, reports, RTA and staff. This leaves most endpoint permissions, ownership boundaries and multi-step workflows without direct test coverage in their owning app. Tests were not executed as part of this audit.

## Source-Evidenced Findings and Review Priorities

These are review findings from the current source, not changes made by this report.

1. **Quote detail ownership is inconsistent with list scoping.** The list selector scopes Sales Staff to their quotes, but `QuoteDetailView.get_object(pk, user=None)` only enforces ownership when given a user, and GET/PATCH callers do not pass one. The print route also does not show an owner check. Review `quotes/views.py` around `QuoteDetailView` and `QuotePrintView`.
2. **Registration-document list appears not user-scoped.** `/api/progression/<pk>/registration-documents/` retrieves the progression directly by ID, while detail/download paths use the user-scoped progression lookup in `progression/services.py`. The route requires authentication, but the list may expose document metadata across users' progressions.
3. **Bank-loan detail read is broader than loan mutations.** `/api/finance/bank-loans/<pk>/` only requires authentication and the handler has no owner filter identified; collection and loan mutations are Master-only. The detail response serializes a bank loan.
4. **Several inventory mutations are authenticated-only.** Vehicle deletion/update, expenses, image changes and bulk deletion have no role-level restriction in the view permission layer, unlike delete-all and special-price decision. Confirm whether this broad staff access is intended.
5. **Company detail route ignores its identifier.** `CompanyDetailView` uses the first company rather than selecting by `pk`, although its route accepts an integer ID. The API also rejects creating additional company records.
6. **Permission coverage is thin.** Most app test modules are placeholders; tests around ownership and role-scoped operations should be expanded, particularly for the findings above.
7. **Deployment defaults merit explicit verification.** `DEBUG=True` is the settings fallback, and Django's URLConf does not serve configured static/media URLs. Confirm deployment environment and web-server/storage configuration.
8. **The bank-loan list wiring may be surprising.** `/api/finance/bank-loans/` points to `BankLoanCreateView`, which implements GET and POST and requires Master for both. A separate `BankLoanListView` exists but is not the routed class. Verify whether this is intentional.

## Audit Limits

Exact route patterns, declared methods, and observed access controls are based on repository source. This report does not establish production hostnames, runtime environment variable values, deployed reverse-proxy/static-media behavior, actual database contents, or frontend usage. Endpoint field-level request and response schemas should be confirmed from `/api/schema/` or the endpoint serializers before client integration.
