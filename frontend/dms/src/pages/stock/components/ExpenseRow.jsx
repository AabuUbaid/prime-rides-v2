import { useState } from "react";

function ExpenseRow({ expense, onUpdateExpense, onDeleteExpense }) {
  const [editing, setEditing] = useState(false);

  const [description, setDescription] = useState(expense.description);

  const [amount, setAmount] = useState(expense.amount);

  const handleSave = () => {
    onUpdateExpense(expense.id, {
      description,
      amount,
    });

    setEditing(false);
  };

  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
      <td className="px-4 py-3 text-sm text-slate-700">
        {editing ? (
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          />
        ) : (
          expense.description
        )}
      </td>

      <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-900">
        {editing ? (
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          />
        ) : (
          expense.amount
        )}
      </td>

      <td className="px-4 py-3">
        {editing ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              Save
            </button>

            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDescription(expense.description);
                setAmount(expense.amount);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => onDeleteExpense(expense.id)}
              className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default ExpenseRow;
