import { ArrowDownRight, ArrowUpRight } from "lucide-react";

function KPICard({
  label,
  value,
  icon: Icon,
  accent = "amber",
  trend,
  trendLabel,
}) {
  const accents = {
    amber: {
      icon: "border-amber-200 bg-amber-50 text-amber-600",
      value: "text-amber-600",
      line: "bg-amber-500",
    },

    cyan: {
      icon: "border-cyan-200 bg-cyan-50 text-cyan-600",
      value: "text-cyan-600",
      line: "bg-cyan-500",
    },

    emerald: {
      icon: "border-emerald-200 bg-emerald-50 text-emerald-600",
      value: "text-emerald-600",
      line: "bg-emerald-500",
    },

    blue: {
      icon: "border-blue-200 bg-blue-50 text-blue-600",
      value: "text-blue-600",
      line: "bg-blue-500",
    },

    rose: {
      icon: "border-rose-200 bg-rose-50 text-rose-600",
      value: "text-rose-600",
      line: "bg-rose-500",
    },
  };

  const theme = accents[accent] || accents.amber;

  const positive = typeof trend === "number" ? trend >= 0 : null;

  return (
    <section
      className={[
        "group relative overflow-hidden",
        "rounded-2xl border border-slate-200",
        "bg-white p-5",
        "shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
        "transition-all duration-200",
        "hover:-translate-y-0.5",
        "hover:border-slate-300",
        "hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]",
      ].join(" ")}
    >
      {/* Accent line */}
      <div
        className={[
          "absolute left-0 top-0 h-0.5 w-full",
          theme.line,
          "opacity-80",
        ].join(" ")}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p
            className={[
              "mt-3",
              "font-mono text-xl font-bold",
              "leading-tight tracking-tight",
              "whitespace-nowrap",
              theme.value,
            ].join(" ")}
            title={String(value)}
          >
            {value}
          </p>

          {typeof trend === "number" && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px]">
              {positive ? (
                <ArrowUpRight size={13} className="text-emerald-500" />
              ) : (
                <ArrowDownRight size={13} className="text-rose-500" />
              )}

              <span
                className={
                  positive
                    ? "font-semibold text-emerald-600"
                    : "font-semibold text-rose-600"
                }
              >
                {Math.abs(trend)}%
              </span>

              {trendLabel && (
                <span className="text-slate-400">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center",
              "rounded-xl border",
              theme.icon,
            ].join(" ")}
          >
            <Icon size={17} />
          </div>
        )}
      </div>
    </section>
  );
}

export default KPICard;
