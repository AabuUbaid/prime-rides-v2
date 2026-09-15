import { useState } from "react";

function ExpenseForm({ onAddExpense }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!description.trim() || !amount) return;

    onAddExpense({
      description,
      amount,
    });

    setDescription("");
    setAmount("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">Add Expense</h3>

        <p className="mt-1 text-xs text-slate-500">
          Record an inventory-related expense.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            Description
          </label>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            Amount
          </label>

          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-4 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
      >
        Add Expense
      </button>
    </form>
  );
}

export default ExpenseForm;
