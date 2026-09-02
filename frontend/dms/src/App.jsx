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
