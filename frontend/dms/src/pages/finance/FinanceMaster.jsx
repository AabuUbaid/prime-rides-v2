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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-red-700">
              Access denied
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Finance Master is available only to Master users.
            </p>

            <Link
              to="/dashboard"
              className="mt-4 inline-flex rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
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
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prime Rides</h1>

            <p className="text-sm text-gray-500">Dealer Management System</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Dashboard
            </Link>

            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name}
              </p>

              <p className="text-xs uppercase text-gray-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Finance Master
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Access finance transactions, estimates, and configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {FINANCE_MASTER.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {item.description}
                  </p>
                </div>

                <span className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-700">
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
