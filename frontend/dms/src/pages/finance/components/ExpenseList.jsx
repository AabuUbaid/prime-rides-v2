import PropTypes from "prop-types";

function ExpenseList({
    options,
    selectedTypes,
    onToggle,
    disabled = false,
}) {
    if (options.length === 0) {
        return (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                    No active Expense Presets are currently configured.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {options.map((option) => {
                const selected = selectedTypes.includes(option.value);

                return (
                    <label
                        key={option.key}
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-4 transition hover:bg-gray-50"
                    >
                        <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => onToggle(option.value)}
                            disabled={disabled}
                            className="mt-1"
                        />

                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                                {option.label}
                            </p>

                            {option.description && (
                                <p className="text-sm font-medium text-gray-800">
                                    {option.description}
                                </p>
                            )}
                        </div>
                    </label>
                );
            })}
        </div>
    );
}

ExpenseList.propTypes = {
    options: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number,
            ]).isRequired,
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            description: PropTypes.string,
        }),
    ).isRequired,
    selectedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
    onToggle: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

export default ExpenseList;