import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, helper, required = false, className = "", id, ...props },
  ref,
) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
        >
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}

      <input
        ref={ref}
        id={id}
        className={[
          "h-10 w-full rounded-xl border",
          "bg-white px-3 text-sm text-slate-800",
          "placeholder:text-slate-400",
          "transition-colors",
          "focus:border-amber-400 focus:outline-none",
          "focus:ring-2 focus:ring-amber-400/15",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          error
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400/15"
            : "border-slate-200",
          className,
        ].join(" ")}
        {...props}
      />

      {error && (
        <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>
      )}

      {!error && helper && (
        <p className="mt-1 text-xs text-slate-400">{helper}</p>
      )}
    </div>
  );
});

export default Input;
