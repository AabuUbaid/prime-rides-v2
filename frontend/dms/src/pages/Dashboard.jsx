import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Prime Rides Dashboard</h1>

      <p className="mt-4">
        Logged in as: <strong>{user?.email}</strong>
      </p>

      <p>
        Role: <strong>{user?.role}</strong>
      </p>

      <button onClick={logout} className="mt-6 border px-4 py-2 rounded">
        Logout
      </button>
    </div>
  );
}
export default Dashboard;
