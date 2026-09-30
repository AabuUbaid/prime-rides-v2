import {
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Car,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileChartColumnIncreasing,
  FileCheck2,
  FileText,
  GitBranch,
  Landmark,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

function Sidebar({ user, onLogout, mobileOpen, onCloseMobile }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const sections = [
    {
      title: "Core Operations",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
          end: true,
        },
        {
          label: "Inventory",
          path: "/stock",
          icon: Car,
        },
        {
          label: "Cars in Demand",
          path: "/car-demands",
          icon: ClipboardList,
        },
        {
          label: "Special Price",
          path: "/special-price",
          icon: Tags,
        },
        {
          label: "Progression",
          path: "/progression",
          icon: GitBranch,
        },
        {
          label: "Procurement Checks",
          path: "/stock/procurement-checks",
          icon: ClipboardList,
        },
      ],
    },

    {
      title: "Sales & Customers",
      items: [
        {
          label: "Emi Calculator",
          path: "/finance/emi/list",
          icon: Calculator,
        },
        {
          label: "Quotes",
          path: "/deals",
          icon: FileText,
        },
        {
          label: "Customers",
          path: "/customers",
          icon: Users,
        },
        {
          label: "Leads",
          path: "/leads",
          icon: UserRound,
        },
      ],
    },

    {
      title: "Finance",
      items: [
        {
          label: "Bank Loans",
          path: "/finance/bank-loans",
          icon: Landmark,
          roles: ["MASTER"],
        },
        {
          label: "Cash Deals",
          path: "/finance/cash-deals",
          icon: Banknote,
          roles: ["MASTER"],
        },
        {
          label: "Cash Receipts",
          path: "/finance/cash-receipts",
          icon: ReceiptText,
          roles: ["MASTER", "ADMIN"],
        },
        {
          label: "Balance Sheets",
          path: "/finance/balance-sheets",
          icon: BarChart3,
        },
        {
          label: "Insurance",
          path: "/finance/insurance",
          icon: ShieldCheck,
        },
        {
          label: "Finance",
          path: "/finance/master",
          icon: WalletCards,
        },
      ],
    },

    {
      title: "Documents",
      items: [
        {
          label: "Proformas",
          path: "/finance/proformas",
          icon: FileCheck2,
        },
        {
          label: "Delivery Notes",
          path: "/finance/delivery-notes",
          icon: ClipboardList,
        },
      ],
    },

    {
      title: "Management",
      items: [
        {
          label: "Staff",
          path: "/staff",
          icon: BriefcaseBusiness,
          roles: ["MASTER", "ADMIN"],
        },
        {
          label: "Reports",
          path: "/reports",
          icon: FileChartColumnIncreasing,
        },
        {
          label: "User Access",
          path: "/user-access",
          icon: Users,
          roles: ["MASTER"],
        },
        {
          label: "Attendance",
          path: "/staff/attendance",
          icon: ClipboardList,
          roles: ["MASTER", "ADMIN"],
        },
        {
          label: "Payroll",
          path: "/staff/payroll",
          icon: ReceiptText,
          roles: ["MASTER", "ADMIN"],
        },
        {
          label: "Ledger Accounts",
          path: "/ledger-accounts",
          icon: WalletCards,
        },
        {
          label: "Settings",
          path: "/finance/settings",
          icon: Settings,
        },
        {
          label: "Company & Branches",
          path: "/company",
          icon: Building2,
          roles: ["MASTER"],
        },
      ],
    },
  ];

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.includes(user?.role),
      ),
    }))
    .filter((section) => section.items.length > 0);

  const handleNavigate = (path) => {
    navigate(path);
    onCloseMobile?.();
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "border-r border-slate-800/80 bg-[#070a11] text-slate-300",
          "shadow-2xl transition-all duration-300 ease-in-out",
          collapsed ? "w-[76px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-800/80 px-3">
          <button
            type="button"
            onClick={() => handleNavigate("/dashboard")}
            className={[
              "flex min-w-0 items-center gap-3",
              collapsed ? "w-full justify-center" : "",
            ].join(" ")}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-400 shadow-lg shadow-amber-500/10">
              <Car size={19} />
            </div>

            {!collapsed && (
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-extrabold uppercase tracking-tight text-white">
                    Prime Rides
                  </span>

                  <span className="rounded border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-300">
                    UAE
                  </span>
                </div>

                <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Dealer Management System
                </p>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="hidden rounded-lg border border-transparent p-1.5 text-slate-500 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white lg:block"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        </div>

        {/* Quick action */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <button
              type="button"
              onClick={() => handleNavigate("/stock/add")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-3 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/15 transition hover:from-amber-400 hover:to-amber-300"
            >
              <Sparkles size={14} />
              Add Vehicle
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="custom-scrollbar flex-1 overflow-y-auto px-2.5 py-4">
          <div className="space-y-5">
            {visibleSections.map((section) => (
              <section key={section.title}>
                {!collapsed && (
                  <div className="mb-1.5 px-2.5 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                    {section.title}
                  </div>
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={onCloseMobile}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          [
                            "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs font-semibold transition-all",
                            collapsed ? "justify-center" : "",
                            isActive
                              ? "bg-amber-400/12 text-amber-300"
                              : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
                          ].join(" ")
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-amber-400" />
                            )}

                            <span
                              className={[
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                isActive
                                  ? "bg-amber-400/10 text-amber-300"
                                  : "bg-slate-800/40 text-slate-500 group-hover:text-slate-300",
                              ].join(" ")}
                            >
                              <Icon size={15} />
                            </span>

                            {!collapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-slate-800/80 p-3">
          <div
            className={[
              "flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5",
              collapsed ? "justify-center" : "",
            ].join(" ")}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-xs font-bold text-cyan-400">
              {(
                user?.first_name?.[0] ||
                user?.username?.[0] ||
                "U"
              ).toUpperCase()}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">
                  {user?.first_name || user?.username || "User"}
                </p>

                <p className="truncate text-[9px] uppercase tracking-wide text-slate-500">
                  {user?.role || "User"}
                </p>
              </div>
            )}

            {!collapsed && (
              <button
                type="button"
                onClick={onLogout}
                title="Logout"
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
