import { useEffect, useState } from "react";
import {
  Car,
  CheckCircle2,
  Clock3,
  Package,
  ShieldCheck,
  Sparkles,
  Wrench,
  WalletCards,
} from "lucide-react";

import KPICard from "../components/ui/KPICard";
import { getDashboardSummary } from "../api/inventory";
import { formatAED } from "../utils/formatters";

function Dashboard() {
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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  if (!summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa] px-4">
        <div className="rounded-2xl border border-rose-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-medium text-rose-600">
            Failed to load dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Main */}
      {/* Page heading */}
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your vehicle inventory and financial position.
          </p>
        </div>

        {/* Inventory Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard
            label="Total Vehicles"
            value={summary.total_vehicles}
            icon={Car}
            accent="cyan"
          />

          <KPICard
            label="Available"
            value={summary.available}
            icon={CheckCircle2}
            accent="emerald"
          />

          <KPICard
            label="Upcoming"
            value={summary.upcoming}
            icon={Clock3}
            accent="blue"
          />

          <KPICard
            label="Reserved"
            value={summary.reserved}
            icon={Package}
            accent="amber"
          />

          <KPICard
            label="Sold"
            value={summary.sold}
            icon={ShieldCheck}
            accent="rose"
          />

          <KPICard
            label="In House"
            value={summary.in_house}
            icon={Car}
            accent="cyan"
          />

          <KPICard
            label="In Service"
            value={summary.in_service}
            icon={Wrench}
            accent="amber"
          />

          <KPICard
            label="Highlighted"
            value={summary.highlighted_vehicles}
            icon={Sparkles}
            accent="blue"
          />
        </div>
      </div>

      {/* Financial Overview */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-800">
            Financial Overview
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Current inventory and expense position.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPICard
            label="Inventory Value"
            value={formatAED(summary.inventory_value)}
            icon={WalletCards}
            accent="amber"
          />

          <KPICard
            label="Average Purchase Cost"
            value={formatAED(summary.average_purchase_cost)}
            icon={WalletCards}
            accent="cyan"
          />

          <KPICard
            label="Average Asking Price"
            value={formatAED(summary.average_asking_price)}
            icon={WalletCards}
            accent="blue"
          />

          <KPICard
            label="Total Expenses"
            value={formatAED(summary.total_expenses)}
            icon={WalletCards}
            accent="rose"
          />
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
