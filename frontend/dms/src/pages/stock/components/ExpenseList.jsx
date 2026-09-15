import ExpenseRow from "./ExpenseRow";

function ExpenseList({ expenses, onUpdateExpense, onDeleteExpense }) {
  if (expenses.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
        No expenses recorded.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Description
            </th>

            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Amount
            </th>

            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onUpdateExpense={onUpdateExpense}
              onDeleteExpense={onDeleteExpense}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExpenseList;
