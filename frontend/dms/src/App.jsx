import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import AddCar from "./pages/stock/AddCar";
import Stock from "./pages/stock/Stock";
import CarDetails from "./pages/stock/CarDetails";
import EditCar from "./pages/stock/EditCar";
import SpecialPrice from "./pages/stock/SpecialPrice";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import FinanceMaster from "./pages/finance/FinanceMaster";
import FinanceSettings from "./pages/finance/FinanceSettings";
import BankManagement from "./pages/finance/BankManagement";
import ExpensePresetManagement from "./pages/finance/ExpensePresetManagement";
import InsuranceBandManagement from "./pages/finance/InsuranceBandManagement";
import ServicePackageManagement from "./pages/finance/ServicePackageManagement";
import BankProcessingManagement from "./pages/finance/BankProcessingManagement";
import EmiCalculator from "./pages/finance/EmiCalculator";
import EmiList from "./pages/finance/EmiList";
import EmiDetail from "./pages/finance/EmiDetail";
import BankLoans from "./pages/finance/BankLoans";
import BankLoanDetail from "./pages/finance/BankLoanDetail";
import CashDeals from "./pages/finance/CashDeals";
import CashDealDetail from "./pages/finance/CashDealDetail";
import CashReceipts from "./pages/finance/CashReceipts";
import CashReceiptDetail from "./pages/finance/CashReceiptDetail";
import CashReceiptCreate from "./pages/finance/CashReceiptCreate";
import BalanceSheets from "./pages/finance/BalanceSheets";
import BalanceSheetDetail from "./pages/finance/BalanceSheetDetail";
import BalanceSheetCreate from "./pages/finance/BalanceSheetCreate";
import BalanceSheetPrint from "./pages/finance/BalanceSheetPrint";
import Insurance from "./pages/finance/Insurance";
import InsuranceDetail from "./pages/finance/InsuranceDetail";
import Proformas from "./pages/finance/Proformas";
import ProformaCreate from "./pages/finance/ProformaCreate";
import ProformaDetail from "./pages/finance/ProformaDetail";
import ProformaPrint from "./pages/finance/ProformaPrint";
import DeliveryNotes from "./pages/finance/DeliveryNotes";
import DeliveryNoteCreate from "./pages/finance/DeliveryNoteCreate";
import DeliveryNoteDetail from "./pages/finance/DeliveryNoteDetail";
import DeliveryNotePrint from "./pages/finance/DeliveryNotePrint";

import Quotes from "./pages/deals/Quotes";
import NewQuote from "./pages/deals/NewQuote";
import QuoteDetail from "./pages/deals/QuoteDetail";

import Customers from "./pages/customers/Customers";
import NewCustomer from "./pages/customers/NewCustomer";
import CustomerDetail from "./pages/customers/CustomerDetail";
import EditCustomer from "./pages/customers/EditCustomer";

import Progressions from "./pages/progression/Progressions";
import ProgressionDetail from "./pages/progression/ProgressionDetail";
import Staff from "./pages/staff/Staff";
import StaffPerformance from "./pages/staff/StaffPerformance";
import UserAccess from "./pages/admin/UserAccess";
import Leads from "./pages/leads/Leads";
import LeadDetail from "./pages/leads/LeadDetail";
import LedgerAccounts from "./pages/ledger/LedgerAccounts";
import RoleRoute from "./routes/RoleRoute";

import CompanyManagement from "./pages/company/CompanyManagement";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={2500} />

        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/master"
              element={
                <ProtectedRoute>
                  <FinanceMaster />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/settings"
              element={
                <ProtectedRoute>
                  <FinanceSettings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/settings/banks"
              element={
                <ProtectedRoute>
                  <BankManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/settings/expense-presets"
              element={
                <ProtectedRoute>
                  <ExpensePresetManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/settings/insurance-bands"
              element={
                <ProtectedRoute>
                  <InsuranceBandManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/settings/service-packages"
              element={
                <ProtectedRoute>
                  <ServicePackageManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/settings/bank-processing"
              element={
                <ProtectedRoute>
                  <BankProcessingManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/emi"
              element={
                <ProtectedRoute>
                  <EmiCalculator />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/emi/list"
              element={
                <ProtectedRoute>
                  <EmiList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/emi/:id"
              element={
                <ProtectedRoute>
                  <EmiDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/insurance"
              element={
                <ProtectedRoute>
                  <Insurance />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/insurance/:id"
              element={
                <ProtectedRoute>
                  <InsuranceDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/proformas"
              element={
                <ProtectedRoute>
                  <Proformas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/proformas/new"
              element={
                <ProtectedRoute>
                  <ProformaCreate />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/proformas/:id"
              element={
                <ProtectedRoute>
                  <ProformaDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/proformas/:id/print"
              element={
                <ProtectedRoute>
                  <ProformaPrint />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/delivery-notes"
              element={
                <ProtectedRoute>
                  <DeliveryNotes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/delivery-notes/new"
              element={
                <ProtectedRoute>
                  <DeliveryNoteCreate />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/delivery-notes/:id"
              element={
                <ProtectedRoute>
                  <DeliveryNoteDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/delivery-notes/:id/print"
              element={
                <ProtectedRoute>
                  <DeliveryNotePrint />
                </ProtectedRoute>
              }
            />

            <Route
              path="/deals"
              element={
                <ProtectedRoute>
                  <Quotes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/deals/new"
              element={
                <ProtectedRoute>
                  <NewQuote />
                </ProtectedRoute>
              }
            />

            <Route
              path="/deals/:id"
              element={
                <ProtectedRoute>
                  <QuoteDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers/new"
              element={
                <ProtectedRoute>
                  <NewCustomer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers/:id"
              element={
                <ProtectedRoute>
                  <CustomerDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers/:id/edit"
              element={
                <ProtectedRoute>
                  <EditCustomer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/bank-loans"
              element={
                <RoleRoute allowedRoles={["MASTER"]}>
                  <BankLoans />
                </RoleRoute>
              }
            />

            <Route
              path="/finance/bank-loans/:id"
              element={
                <RoleRoute allowedRoles={["MASTER"]}>
                  <BankLoanDetail />
                </RoleRoute>
              }
            />

            <Route
              path="/finance/cash-deals"
              element={
                <RoleRoute allowedRoles={["MASTER"]}>
                  <CashDeals />
                </RoleRoute>
              }
            />

            <Route
              path="/finance/cash-deals/:id"
              element={
                <RoleRoute allowedRoles={["MASTER"]}>
                  <CashDealDetail />
                </RoleRoute>
              }
            />

            <Route
              path="/finance/cash-receipts"
              element={
                <RoleRoute allowedRoles={["MASTER", "ADMIN"]}>
                  <CashReceipts />
                </RoleRoute>
              }
            />

            <Route
              path="/finance/cash-receipts/:id"
              element={
                <RoleRoute allowedRoles={["MASTER", "ADMIN"]}>
                  <CashReceiptDetail />
                </RoleRoute>
              }
            />

            <Route
              path="/finance/cash-receipts/new"
              element={
                <RoleRoute allowedRoles={["MASTER", "ADMIN"]}>
                  <CashReceiptCreate />
                </RoleRoute>
              }
            />

            <Route
              path="/finance/balance-sheets"
              element={
                <ProtectedRoute>
                  <BalanceSheets />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/balance-sheets/:id"
              element={
                <ProtectedRoute>
                  <BalanceSheetDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/balance-sheets/new"
              element={
                <ProtectedRoute>
                  <BalanceSheetCreate />
                </ProtectedRoute>
              }
            />

            <Route
              path="/finance/balance-sheets/:id/print"
              element={
                <ProtectedRoute>
                  <BalanceSheetPrint />
                </ProtectedRoute>
              }
            />

            <Route
              path="/progression"
              element={
                <ProtectedRoute>
                  <Progressions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/progression/:id"
              element={
                <ProtectedRoute>
                  <ProgressionDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <RoleRoute allowedRoles={["MASTER", "ADMIN"]}>
                  <Staff />
                </RoleRoute>
              }
            />
            <Route
              path="/staff/:id/performance"
              element={
                <RoleRoute allowedRoles={["MASTER", "ADMIN"]}>
                  <StaffPerformance />
                </RoleRoute>
              }
            />
            <Route
              path="/user-access"
              element={
                <RoleRoute allowedRoles={["MASTER"]}>
                  <UserAccess />
                </RoleRoute>
              }
            />
            <Route
              path="/leads"
              element={
                <ProtectedRoute>
                  <Leads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/:id"
              element={
                <ProtectedRoute>
                  <LeadDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ledger-accounts"
              element={
                <ProtectedRoute>
                  <LedgerAccounts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/company"
              element={
                <RoleRoute allowedRoles={["MASTER"]}>
                  <CompanyManagement />
                </RoleRoute>
              }
            />


            <Route
              path="/stock/add"
              element={
                <ProtectedRoute>
                  <AddCar />
                </ProtectedRoute>
              }
            />

            <Route
              path="/stock"
              element={
                <ProtectedRoute>
                  <Stock />
                </ProtectedRoute>
              }
            />

            <Route
              path="/stock/:id"
              element={
                <ProtectedRoute>
                  <CarDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/stock/:id/edit"
              element={
                <ProtectedRoute>
                  <EditCar />
                </ProtectedRoute>
              }
            />
            <Route path="/special-price" element={<SpecialPrice />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
