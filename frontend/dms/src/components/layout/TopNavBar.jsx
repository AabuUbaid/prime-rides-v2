import { useMemo, useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, Search, User, X } from "lucide-react";

function TopNavBar({ user, onLogout, onNavigate, currentPage = "Dashboard" }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Inventory", path: "/stock" },
      { label: "Quotes", path: "/deals" },
      { label: "Customers", path: "/customers" },
      { label: "Finance", path: "/finance/master" },
      { label: "Bank Loans", path: "/finance/bank-loans" },
      { label: "Cash Deals", path: "/finance/cash-deals" },
      { label: "Cash Receipts", path: "/finance/cash-receipts" },
      { label: "Progression", path: "/progressions" },
    ],
    [],
  );

  const handleNavigate = (path) => {
    setMobileOpen(false);

    if (onNavigate) {
      onNavigate(path);
      return;
    }

    window.location.href = path;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#090d16]/95 shadow-2xl backdrop-blur-xl">
      {/* Top status strip */}
      <div className="hidden border-b border-slate-800/80 bg-[#05070c] px-6 py-1.5 lg:flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

          <span className="font-bold tracking-wide text-slate-300">
            PRIME RIDES CLOUD DMS
          </span>

          <span className="text-slate-700">|</span>

          <span className="font-medium text-cyan-400">
            UAE DEALER OPERATIONS
          </span>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono">
          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-bold text-amber-400">
            AED CURRENCY
          </span>

          <span className="text-slate-500">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Main navigation */}
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <button
          type="button"
          onClick={() => handleNavigate("/dashboard")}
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.12)] transition-transform group-hover:scale-105">
            <span className="text-sm font-black text-amber-400">PR</span>
          </div>

          <div className="hidden flex-col sm:flex">
            <div className="flex items-center gap-2">
              <span className="chrome-text text-lg font-black uppercase tracking-wider">
                PRIME RIDES
              </span>

              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-400">
                UAE
              </span>
            </div>

            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
              Dealer Management System
            </span>
          </div>
        </button>

        {/* Desktop navigation */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
          {navItems.map((item) => {
            const active = currentPage === item.label;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigate(item.path)}
                className={[
                  "rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "border border-amber-500/25 bg-amber-500/10 text-amber-400"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="hidden rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-slate-400 transition hover:border-cyan-500/40 hover:bg-slate-800 hover:text-cyan-400 sm:flex"
            aria-label="Search"
          >
            <Search size={16} />
          </button>

          <button
            type="button"
            className="hidden rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-slate-400 transition hover:border-cyan-500/40 hover:bg-slate-800 hover:text-cyan-400 sm:flex"
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>

          <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 md:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400">
              <User size={14} />
            </div>

            <div className="leading-tight">
              <p className="text-xs font-semibold text-slate-200">
                {user?.first_name || "User"}
              </p>

              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                {user?.role || "USER"}
              </p>
            </div>

            <ChevronDown size={14} className="text-slate-500" />
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 md:flex"
          >
            <LogOut size={14} />
            Logout
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-400 xl:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="border-t border-slate-800 bg-[#080c14] px-4 py-3 xl:hidden">
          <nav className="grid gap-1">
            {navItems.map((item) => {
              const active = currentPage === item.label;

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={[
                    "flex items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  ].join(" ")}
                >
                  <span>{item.label}</span>

                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onLogout}
              className="mt-2 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-3 text-left text-sm font-medium text-rose-300"
            >
              <LogOut size={15} />
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default TopNavBar;
