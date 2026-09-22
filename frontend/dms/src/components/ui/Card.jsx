function Card({
  children,
  className = "",
  title,
  description,
  actions,
  noPadding = false,
}) {
  return (
    <section
      className={[
        "overflow-hidden rounded-2xl",
        "border border-[#e5e7eb]",
        "bg-white",
        "shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
        className,
      ].join(" ")}
    >
      {(title || description || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            )}

            {description && (
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            )}
          </div>

          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}

      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export default Card;
