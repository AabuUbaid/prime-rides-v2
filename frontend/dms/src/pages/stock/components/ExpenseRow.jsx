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
    <tr>
      <td>
        {editing ? (
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        ) : (
          expense.description
        )}
      </td>

      <td>
        {editing ? (
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        ) : (
          expense.amount
        )}
      </td>

      <td>
        {editing ? (
          <>
            <button onClick={handleSave}>Save</button>

            <button
              onClick={() => {
                setEditing(false);
                setDescription(expense.description);
                setAmount(expense.amount);
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)}>✏️Edit</button>

            <button onClick={() => onDeleteExpense(expense.id)}>
              🗑Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
}

export default ExpenseRow;
