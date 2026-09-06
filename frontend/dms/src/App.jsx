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
import FinanceSettings from "./pages/finance/FinanceSettings";
import BankManagement from "./pages/finance/BankManagement";
import ExpensePresetManagement from "./pages/finance/ExpensePresetManagement";
import InsuranceBandManagement from "./pages/finance/InsuranceBandManagement";
import ServicePackageManagement from "./pages/finance/ServicePackageManagement";
import BankProcessingManagement from "./pages/finance/BankProcessingManagement";
import EmiCalculator from "./pages/finance/EmiCalculator";
import EmiList from "./pages/finance/EmiList";
import EmiDetail from "./pages/finance/EmiDetail";

import Quotes from "./pages/deals/Quotes";
import NewQuote from "./pages/deals/NewQuote";
import QuoteDetail from "./pages/deals/QuoteDetail";

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
