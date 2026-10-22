import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarClock, Search, RefreshCw } from "lucide-react";
import PageHeader from "../components/PageHeader";
import MetricCard from "../components/MetricCard";
import { useInvoicesData } from "../hooks/useInvoicesData";

function Invoices({ onRefresh }) {
  const { invoices, obligations, loading, error, refresh } = useInvoicesData();
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("all");
  const [status, setStatus] = useState("all");

  const records = [
    ...invoices.map((invoice) => ({
      ...invoice,
      recordType: "Invoice",
      recordId: `INV-${invoice.id}`,
      recordName: invoice.counterparty || invoice.client || "Unnamed counterparty",
      recordDate: invoice.due_date || invoice.expected_date || invoice.issue_date,
      recordDirection: invoice.direction || "unknown",
    })),
    ...obligations.map((obligation) => ({
      ...obligation,
      recordType: "Obligation",
      recordId: `OBL-${obligation.id}`,
      recordName: obligation.category || "Payment obligation",
      recordDate: obligation.due_date,
      recordDirection: "payable",
      status: obligation.status || "open",
    })),
  ];

  const filtered = records.filter((record) => {
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      [
        record.recordId,
        record.recordName,
        record.currency,
        record.status,
        record.category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));

    const matchesDirection =
      direction === "all" || record.recordDirection === direction;

    const matchesStatus =
      status === "all" ||
      String(record.status || "open").toLowerCase() === status;

    return matchesSearch && matchesDirection && matchesStatus;
  });

  const money = (amount, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  return (
    <>
      <PageHeader
        title="Invoices & Payments"
        description="Track receivables, upcoming obligations, and payment due dates."
        onRefresh={refresh}
        loading={loading}
      />

      {error && (
        <div className="panel error-panel">
          <strong>Some records could not be loaded</strong>
          <p>{error}</p>
          <button className="button button-secondary" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      <section className="metrics-grid">
        <MetricCard
          title="Total invoices"
          value={invoices.length}
          note="Records returned by the API"
          icon={ReceiptText}
          tone="blue"
        />
        <MetricCard
          title="Receivables"
          value={invoices.filter((item) => item.direction === "receivable").length}
          note="Incoming invoice records"
          icon={ArrowDownRight}
          tone="green"
        />
        <MetricCard
          title="Payables"
          value={invoices.filter((item) => item.direction === "payable").length}
          note="Outgoing invoice records"
          icon={ArrowUpRight}
          tone="amber"
        />
        <MetricCard
          title="Obligations"
          value={obligations.length}
          note="Scheduled payment obligations"
          icon={CalendarClock}
          tone="purple"
        />
      </section>

      <section className="panel invoices-panel">
        <div className="invoice-toolbar">
          <div className="invoice-search">
            <Search size={17} />
            <input
              aria-label="Search financial records"
              placeholder="Search counterparty, ID, currency…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            aria-label="Filter by direction"
            value={direction}
            onChange={(event) => setDirection(event.target.value)}
          >
            <option value="all">All directions</option>
            <option value="receivable">Receivables</option>
            <option value="payable">Payables</option>
          </select>

          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Counterparty / category</th>
                <th>Type</th>
                <th>Due date</th>
                <th>Amount</th>
                <th>Status / priority</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={`${record.recordType}-${record.id}`}>
                  <td>
                    <strong>{record.recordId}</strong>
                    <div className="muted-cell">{record.recordType}</div>
                  </td>
                  <td>{record.recordName}</td>
                  <td>
                    {record.recordDirection === "receivable"
                      ? "Receivable"
                      : record.recordDirection === "payable"
                        ? "Payable"
                        : "Unknown"}
                  </td>
                  <td>{record.recordDate || "—"}</td>
                  <td>{money(record.amount, record.currency || "INR")}</td>
                  <td>
                    <span className="status-pill status-amber">
                      {record.status || record.priority || "Open"}
                    </span>
                    {record.priority && (
                      <div className="muted-cell">
                        Priority: {record.priority}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            No records match the selected search and filters.
          </div>
        )}

        {loading && <div className="empty-state">Loading financial records…</div>}

        <div className="invoice-table-footer">
          <span>{filtered.length} of {records.length} records</span>
          <button
            className="button button-secondary"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </section>
    </>
  );
}

export default Invoices;
