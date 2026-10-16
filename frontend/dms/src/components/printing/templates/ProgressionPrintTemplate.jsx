function display(value) {
    if (value === null || value === undefined || value === "") {
        return "";
    }

    return String(value);
}

function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-GB");
}

function formatMoney(value) {
    if (value === null || value === undefined || value === "") {
        return "";
    }

    const amount = Number(value);

    if (!Number.isFinite(amount) || amount === 0) {
        return "";
    }

    return amount.toLocaleString("en-AE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatStatus(value) {
    if (!value) return "";

    return String(value).replace(/_/g, " ").replace(/\b\w/g, (char) =>
        char.toUpperCase(),
    );
}

const EMIRATE_LABELS = {
    Dubai: "DXB",
    "Abu Dhabi": "AUH",
    Sharjah: "SHJ",
    Ajman: "AJMAN",
    Fujairah: "FUJ",
    "Ras Al Khaimah": "RAK",
    "Umm Al Quwain": "UAQ",
};

function getCompletedStages(item) {
    const completed = {
        evaluation: false,
        passing: false,
        insurance: false,
        registration: false,
        delivery_video: false,
    };

    switch (item.current_stage) {
        case "passing":
        case "dubai_passing":
            completed.evaluation = true;
            break;

        case "registration_passing":
            completed.evaluation = true;
            completed.passing = true;
            break;

        case "insurance":
            completed.evaluation = true;
            completed.passing = true;
            completed.insurance = Boolean(item.insuranceApproved);
            break;

        case "registration":
            completed.evaluation = true;
            completed.passing = true;
            completed.insurance = true;
            break;

        case "delivery_video":
            completed.evaluation = true;
            completed.passing = true;
            completed.insurance = true;
            completed.registration = true;
            break;

        case "completed":
            completed.evaluation = true;
            completed.passing = true;
            completed.insurance = true;
            completed.registration = true;
            completed.delivery_video = true;
            break;

        case "evaluation":
        default:
            break;
    }

    return completed;
}

function CheckCell({ checked }) {
    return (
        <span className={`progression-check ${checked ? "checked" : ""}`}>
            {checked ? "✓" : ""}
        </span>
    );
}

function ProgressionSection({ title, rows }) {
    if (!rows.length) return null;

    return (
        <section className="progression-print-section">
            <div className="progression-section-title">{title}</div>

            <table className="progression-print-table">
                <colgroup>
                    {[
                        8, 6, 3, 5, 5, 8, 4, 5, 17, 6, 6, 6, 4, 6,
                        2.2, 2.2, 2.2, 2.2, 2.2,
                    ].map((width, index) => (
                        <col key={index} style={{ width: `${width}%` }} />
                    ))}
                </colgroup>

                <thead>
                    <tr className="progression-group-header">
                        <th colSpan={14}></th>
                        <th colSpan={5}>RTA STATUS</th>
                    </tr>

                    <tr>
                        <th>Chasis No:</th>
                        <th>Vehicle</th>
                        <th>Model</th>
                        <th>Status</th>
                        <th>Seller</th>
                        <th>Customer</th>
                        <th>Bank</th>
                        <th>Submitted date</th>
                        <th>Remark</th>
                        <th>Selling Price</th>
                        <th>Evaluation</th>
                        <th>Advance Amount</th>
                        <th>REG</th>
                        <th>Cust No:</th>
                        <th>E</th>
                        <th>P</th>
                        <th>I</th>
                        <th>R</th>
                        <th>D/V</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((item) => {
                        const stages = getCompletedStages(item);

                        const vehicle = [
                            item.vehicle_make,
                            item.vehicle_model,
                        ]
                            .filter(Boolean)
                            .join(" ");

                        return (
                            <tr key={item.id}>
                                <td>{display(item.chassis_number)}</td>
                                <td>{vehicle || display(item.vehicle_stock_id)}</td>
                                <td>{display(item.vehicle_year)}</td>

                                <td
                                    className={
                                        String(item.deal_status || "").toLowerCase() === "approved"
                                            ? "progression-status-approved"
                                            : String(item.deal_status || "")
                                                .toLowerCase()
                                                .includes("applied")
                                                ? "progression-status-applied"
                                                : ""
                                    }
                                >
                                    {formatStatus(item.deal_status)}
                                </td>

                                <td>{display(item.seller_name)}</td>
                                <td>{display(item.customer_name)}</td>
                                <td>{display(item.bank_name)}</td>
                                <td>{formatDate(item.submitted_date)}</td>
                                <td className="progression-remark">
                                    {display(item.deal_remark || item.remark)}
                                </td>
                                <td>{formatMoney(item.selling_price)}</td>
                                <td>{formatMoney(item.evaluation_price)}</td>
                                <td>{formatMoney(item.advance_amount)}</td>
                                <td>
                                    {EMIRATE_LABELS[item.registration_emirate] ||
                                        display(item.registration_emirate)}
                                </td>
                                <td>{display(item.customer_mobile)}</td>

                                <td>
                                    <CheckCell checked={stages.evaluation} />
                                </td>
                                <td>
                                    <CheckCell checked={stages.passing} />
                                </td>
                                <td>
                                    <CheckCell checked={stages.insurance} />
                                </td>
                                <td>
                                    <CheckCell checked={stages.registration} />
                                </td>
                                <td>
                                    <CheckCell checked={stages.delivery_video} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </section>
    );
}

export default function ProgressionPrintTemplate({ items = [] }) {
    const activeRows = items.filter((item) => item.status === "active");

    const bankLoanRows = activeRows.filter(
        (item) => item.source_type === "finance",
    );

    const cashDealRows = activeRows.filter(
        (item) => item.source_type === "cash",
    );

    return (
        <div className="progression-print-document">
            <style>{`
        @page {
          size: A3 landscape;
          margin: 7mm;
        }

        .progression-print-document {
          width: 100%;
          color: #111;
          background: #fff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8px;
        }

        .progression-section-title {
          margin-top: 8px;
          padding: 5px;
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          background: #c6e0b4;
          border: 1px solid #222;
        }

        .progression-print-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          margin-bottom: 10px;
        }

        .progression-print-table thead {
          display: table-header-group;
        }

        .progression-print-table th,
        .progression-print-table td {
          border: 1px solid #222;
          padding: 4px 3px;
          overflow-wrap: anywhere;
          text-align: center;
          vertical-align: middle;
          font-size: 8px;
        }

        .progression-print-table th {
          background: #b7b7b7;
          font-weight: 700;
        }

        .progression-print-table .progression-group-header th {
          height: 20px;
          background: #fff;
        }

        .progression-print-table .progression-group-header th:last-child {
          background: #d9e2f3;
        }

        .progression-print-table tbody tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .progression-print-table .progression-remark {
          text-align: left;
        }

        .progression-status-approved {
          background: #d9ead3;
          color: #38761d;
          font-weight: 700;
        }

        .progression-status-applied {
          background: #ffe599;
          font-weight: 700;
        }

        .progression-check {
          display: inline-flex;
          width: 12px;
          height: 12px;
          box-sizing: border-box;
          align-items: center;
          justify-content: center;
          border: 1px solid #111;
          border-radius: 2px;
          background: #fff;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
        }

        .progression-check.checked {
          background: #111;
          color: #fff;
        }
      `}</style>

            {bankLoanRows.length > 0 && (
                <ProgressionSection title="BANK LOAN" rows={bankLoanRows} />
            )}

            {cashDealRows.length > 0 && (
                <ProgressionSection title="Cash Deal" rows={cashDealRows} />
            )}
        </div>
    );
}