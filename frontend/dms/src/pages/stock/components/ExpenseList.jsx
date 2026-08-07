import ExpenseRow from "./ExpenseRow";

function ExpenseList({ expenses, onUpdateExpense, onDeleteExpense }) {
  if (expenses.length === 0) {
    return <p>No expenses recorded.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
          <th>Actions</th>
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
  );
}

export default ExpenseList;
