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
    <tr className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-800">
        {editing ? (
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          expense.description
        )}
      </td>

      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {editing ? (
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          expense.amount
        )}
      </td>

      <td className="px-4 py-3">
        {editing ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save
            </button>

            <button
              onClick={() => {
                setEditing(false);
                setDescription(expense.description);
                setAmount(expense.amount);
              }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ✏️ Edit
            </button>

            <button
              onClick={() => onDeleteExpense(expense.id)}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              🗑 Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default ExpenseRow;