import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDashboardSummary } from "../api/inventory";
import { formatAED } from "../utils/formatters";

function Dashboard() {
  const { user, logout } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await getDashboardSummary();

        setSummary(response.data);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p className="text-red-600">
          Failed to load dashboard.
        </p>
      </div>
    );
  }

  const inventoryStats = [
    {
      label: "Total Vehicles",
      value: summary.total_vehicles,
    },
    {
      label: "Available",
      value: summary.available,
    },
    {
      label: "Upcoming",
      value: summary.upcoming,
    },
    {
      label: "Reserved",
      value: summary.reserved,
    },
    {
      label: "Sold",
      value: summary.sold,
    },
    {
      label: "In House",
      value: summary.in_house,
    },
    {
      label: "In Service",
      value: summary.in_service,
    },
    {
      label: "Highlighted",
      value: summary.highlighted_vehicles,
    },
  ];

  const financialStats = [
    {
      label: "Inventory Value",
      value: formatAED(summary.inventory_value),
    },
    {
      label: "Average Purchase Cost",
      value: formatAED(summary.average_purchase_cost),
    },
    {
      label: "Average Asking Price",
      value: formatAED(summary.average_asking_price),
    },
    {
      label: "Total Expenses",
      value: formatAED(summary.total_expenses),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Prime Rides
            </h1>

            <p className="text-sm text-gray-500">
              Dealer Management System
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name}
              </p>

              <p className="text-xs uppercase text-gray-500">
                {user?.role}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Dashboard
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your vehicle inventory and financial position.
          </p>
        </div>

        {/* Inventory Overview */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Inventory Overview
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {inventoryStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Financial Overview */}
        <section className="mt-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Financial Overview
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {financialStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;