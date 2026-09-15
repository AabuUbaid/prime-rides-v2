import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "border-amber-500 bg-amber-500 text-slate-950 hover:bg-amber-400 hover:border-amber-400",

  secondary:
    "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",

  outline: "border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50",

  ghost: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100",

  danger:
    "border-rose-500 bg-rose-500 text-white hover:bg-rose-600 hover:border-rose-600",

  success:
    "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-xs",
  lg: "h-10 px-4 text-sm",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2",
        "rounded-xl border",
        "font-semibold",
        "transition-all duration-150",
        "focus:outline-none focus-visible:ring-2",
        "focus-visible:ring-amber-400/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className,
      ].join(" ")}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}

      {!loading && Icon && <Icon size={14} />}

      <span>{children}</span>
    </button>
  );
}

export default Button;
