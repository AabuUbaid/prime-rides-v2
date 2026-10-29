import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const FINANCE_MASTER = [
  {
    key: "cash-receipts",
    title: "Cash Receipts",
    description:
      "View, create, review, and reverse actual cash receipt transactions.",
    path: "/finance/cash-receipts",
  },
  {
    key: "balance-sheets",
    title: "Balance Sheets",
    description:
      "View deal-level financial positions, transaction history, and print balance sheets.",
    path: "/finance/balance-sheets",
  },

  {
    key: "bank-loans",
    title: "Bank Loans",
    description:
      "Track finance applications, bank decisions, application progress, priorities, and follow-ups.",
    path: "/finance/bank-loans",
  },
  {
    key: "cash-deals",
    title: "Cash Deals",
    description:
      "Track cash-sale deals, advances, outstanding balances, delivery status, and remarks.",
    path: "/finance/cash-deals",
  },
  {
    key: "proformas",
    title: "Proforma Invoices",
    description:
      "Create, view, edit, print, and manage Proforma Invoices for approved Insurance deals.",
    path: "/finance/proformas",
  },
  {
    key: "delivery-notes",
    title: "Delivery Notes",
    description:
      "Create, view, edit, print, and manage vehicle Delivery Notes for approved Insurance deals.",
    path: "/finance/delivery-notes",
  },
  {
    key: "emi-estimates",
    title: "EMI Estimates",
    description: "View and manage saved finance estimates.",
    path: "/finance/emi/list",
  },
  {
    key: "finance-settings",
    title: "Finance Settings",
    description:
      "Manage banks, expense presets, insurance bands, service packages, and bank processing.",
    path: "/finance/settings",
  },
];

function FinanceMaster() {
  const { user } = useAuth();

  if (user?.role !== "MASTER") {
    return (
      <div className="min-h-screen bg-[#f5f6fa] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-rose-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-rose-700">
              Access denied
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Finance Master is available only to Master users.
            </p>

            <Link
              to="/dashboard"
              className="mt-4 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Finance Master
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Access finance transactions, estimates, and configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {FINANCE_MASTER.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className="group rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>

                <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default FinanceMaster;
