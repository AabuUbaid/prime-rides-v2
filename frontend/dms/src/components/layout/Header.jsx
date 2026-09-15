import { Bell, ChevronRight, Menu, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function Header({ onOpenMobileMenu }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getPageInfo = () => {
    const path = location.pathname;

    if (path === "/dashboard") {
      return {
        section: "Dashboard",
        title: "Showroom Dashboard",
      };
    }

    if (path.startsWith("/stock")) {
      return {
        section: "Inventory",
        title: "Vehicle Inventory",
      };
    }

    if (path === "/special-price") {
      return {
        section: "Inventory",
        title: "Special Price Requests",
      };
    }

    if (path.startsWith("/deals")) {
      return {
        section: "Sales",
        title: "Commercial Quotes",
      };
    }

    if (path.startsWith("/customers")) {
      return {
        section: "Customers",
        title: "Customer Directory",
      };
    }

    if (path.startsWith("/leads")) {
      return {
        section: "Sales & CRM",
        title: "Leads & Sales Pipeline",
      };
    }

    if (path.startsWith("/finance/master")) {
      return {
        section: "Finance",
        title: "Finance Master",
      };
    }

    if (path.startsWith("/finance/settings")) {
      return {
        section: "Finance",
        title: "Finance Settings",
      };
    }

    if (path.startsWith("/finance/emi")) {
      return {
        section: "Finance",
        title: "EMI Calculator",
      };
    }

    if (path.startsWith("/finance/bank-loans")) {
      return {
        section: "Finance",
        title: "Bank Loans",
      };
    }

    if (path.startsWith("/finance/cash-deals")) {
      return {
        section: "Finance",
        title: "Cash Deals",
      };
    }

    if (path.startsWith("/finance/cash-receipts")) {
      return {
        section: "Finance",
        title: "Cash Receipts",
      };
    }

    if (path.startsWith("/finance/balance-sheets")) {
      return {
        section: "Finance",
        title: "Balance Sheets",
      };
    }

    if (path.startsWith("/finance/insurance")) {
      return {
        section: "Finance",
        title: "Insurance",
      };
    }

    if (path.startsWith("/finance/proformas")) {
      return {
        section: "Documents",
        title: "Proformas",
      };
    }

    if (path.startsWith("/finance/delivery-notes")) {
      return {
        section: "Documents",
        title: "Delivery Notes",
      };
    }

    if (path.startsWith("/progression")) {
      return {
        section: "Operations",
        title: "Deal Progression",
      };
    }

    if (path.startsWith("/staff")) {
      return {
        section: "Management",
        title: "Staff Management",
      };
    }

    if (path.startsWith("/user-access")) {
      return {
        section: "Management",
        title: "User Access",
      };
    }

    if (path.startsWith("/ledger-accounts")) {
      return {
        section: "Management",
        title: "Ledger Accounts",
      };
    }

    return {
      section: "Prime Rides UAE",
      title: "Dealer Management System",
    };
  };

  const { section, title } = getPageInfo();

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-md sm:px-6">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="transition hover:text-amber-600"
            >
              Prime Rides UAE
            </button>

            <ChevronRight size={12} className="text-slate-300" />

            <span className="truncate uppercase tracking-wider">{section}</span>
          </div>

          <h1 className="truncate text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
            {title}
          </h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
          aria-label="Notifications"
        >
          <Bell size={16} />

          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold text-slate-800">
            Prime Rides UAE
          </p>

          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Dealer Management
          </p>
        </div>
      </div>
    </header>
  );
}

export default Header;
