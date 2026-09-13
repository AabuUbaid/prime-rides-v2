import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AddCar from "./pages/stock/AddCar";
import Stock from "./pages/stock/Stock";
import CarDetails from "./pages/stock/CarDetails";
import EditCar from "./pages/stock/EditCar";

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={2500} />
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
              <ProtectedRoute>
                <BankLoans />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance/bank-loans/:id"
            element={
              <ProtectedRoute>
                <BankLoanDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance/cash-deals"
            element={
              <ProtectedRoute>
                <CashDeals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance/cash-deals/:id"
            element={
              <ProtectedRoute>
                <CashDealDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance/cash-receipts"
            element={
              <ProtectedRoute>
                <CashReceipts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance/cash-receipts/:id"
            element={
              <ProtectedRoute>
                <CashReceiptDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance/cash-receipts/new"
            element={
              <ProtectedRoute>
                <CashReceiptCreate />
              </ProtectedRoute>
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

          <Route path="/stock/:id/edit" element={<EditCar />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
