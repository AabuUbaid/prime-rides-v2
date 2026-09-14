import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
