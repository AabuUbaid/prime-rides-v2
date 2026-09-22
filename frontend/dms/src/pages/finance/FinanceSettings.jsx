import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SETTINGS = [
  {
    key: "banks",
    title: "Banks",
    description:
      "Manage finance banks, interest rates, cash banks, and active status.",
  },
  {
    key: "expense-presets",
    title: "Expense Presets",
    description:
      "Configure dynamic finance expense types and their calculation rules.",
  },
  {
    key: "insurance-bands",
    title: "Insurance Bands",
    description: "Configure vehicle-price-based insurance bands and amounts.",
  },
  {
    key: "service-packages",
    title: "Service Packages",
    description:
      "Manage available service packages and their configured pricing.",
  },
  {
    key: "bank-processing",
    title: "Bank Processing",
    description:
      "Configure bank processing percentages, minimums, and application charges.",
  },
];

function FinanceSettings() {
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
              Finance Master settings are available only to Master users.
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
      {/* Header */}
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

      {/* Main */}
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Finance Master Settings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage finance configuration used by the DMS Finance module.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {SETTINGS.map((setting) => (
            <Link
              key={setting.key}
              to={`/finance/settings/${setting.key}`}
              className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {setting.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {setting.description}
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

export default FinanceSettings;
