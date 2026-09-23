function DataTable({
  columns = [],
  rows = [],
  getRowKey,
  emptyMessage = "No records found.",
  className = "",
}) {
  return (
    <div
      className={[
        "overflow-hidden rounded-2xl",
        "border border-slate-200 bg-white",
        "shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
        className,
      ].join(" ")}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-slate-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={[
                    "px-4 py-3",
                    "text-left text-[10px] font-bold",
                    "uppercase tracking-[0.08em]",
                    "text-slate-500",
                    column.headerClassName || "",
                  ].join(" ")}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={getRowKey ? getRowKey(row, index) : index}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={[
                        "px-4 py-3",
                        "text-sm text-slate-700",
                        column.cellClassName || "",
                      ].join(" ")}
                    >
                      {column.render
                        ? column.render(row, index)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
