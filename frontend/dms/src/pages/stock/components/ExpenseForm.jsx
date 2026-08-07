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
    <form onSubmit={handleSubmit}>
      <div>
        <label>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label>Amount</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <button type="submit">Add Expense</button>
    </form>
  );
}

export default ExpenseForm;
