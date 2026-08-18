import ExpenseRow from "./ExpenseRow";

function ExpenseList({ expenses, onUpdateExpense, onDeleteExpense }) {
  if (expenses.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
        No expenses recorded.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold text-gray-700">
              Description
            </th>

            <th className="px-4 py-3 text-left font-semibold text-gray-700">
              Amount
            </th>

            <th className="px-4 py-3 text-left font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
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