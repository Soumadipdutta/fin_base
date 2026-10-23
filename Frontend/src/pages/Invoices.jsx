import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarClock, ReceiptText, Search, RefreshCw } from "lucide-react";
import PageHeader from "../components/PageHeader";
import MetricCard from "../components/MetricCard";
import { useInvoicesData } from "../hooks/useInvoicesData";
import {
  describeDueDate,
  formatDate,
  formatMoney,
  getPaymentStatus,
  STATUS_PILL_CLASS,
} from "../lib/financeFormatters";

const PRIORITY_CLASS = { critical: "priority-critical", high: "priority-high" };

function Invoices() {
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
      recordStatus: getPaymentStatus(invoice),
    })),
    ...obligations.map((obligation) => ({
      ...obligation,
      recordType: "Obligation",
      recordId: `OBL-${obligation.id}`,
      recordName: obligation.category || "Payment obligation",
      recordDate: obligation.due_date,
      recordDirection: "payable",
      recordStatus: getPaymentStatus(obligation),
    })),
  ].sort((a, b) => String(a.recordDate).localeCompare(String(b.recordDate)));

  const filtered = records.filter((record) => {
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      [
        record.recordId,
        record.recordName,
        record.currency,
        record.recordStatus,
        record.category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));

    const matchesDirection =
      direction === "all" || record.recordDirection === direction;

    const matchesStatus =
      status === "all" || record.recordStatus === status;

    return matchesSearch && matchesDirection && matchesStatus;
  });

  const overdueCount = records.filter((record) => record.recordStatus === "overdue").length;
  const criticalCount = obligations.filter((item) => item.priority === "critical").length;

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
          change={overdueCount ? `${overdueCount} overdue` : "None overdue"}
          direction={overdueCount ? "negative" : "neutral"}
          note="Receivable and payable"
          icon={ReceiptText}
          tone="blue"
        />
        <MetricCard
          title="Receivables"
          value={invoices.filter((item) => item.direction === "receivable").length}
          note="Money owed to you"
          icon={ArrowDownRight}
          tone="green"
        />
        <MetricCard
          title="Payables"
          value={invoices.filter((item) => item.direction === "payable").length}
          note="Bills you owe"
          icon={ArrowUpRight}
          tone="amber"
        />
        <MetricCard
          title="Obligations"
          value={obligations.length}
          change={criticalCount ? `${criticalCount} critical` : ""}
          direction="neutral"
          note="Scheduled payments"
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

          <div className="invoice-filters">
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
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Counterparty / category</th>
                <th>Type</th>
                <th>Due date</th>
                <th className="numeric">Amount</th>
                <th>Status / priority</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const dueNote = describeDueDate(record);

                return (
                  <tr key={`${record.recordType}-${record.id}`}>
                    <td>
                      <strong>{record.recordId}</strong>
                      <div className="muted-cell">{record.recordType}</div>
                    </td>
                    <td className="capitalize">{record.recordName}</td>
                    <td>
                      {record.recordDirection === "receivable"
                        ? "Receivable"
                        : record.recordDirection === "payable"
                          ? "Payable"
                          : "Unknown"}
                    </td>
                    <td>
                      {formatDate(record.recordDate)}
                      {dueNote && (
                        <div className={`muted-cell ${record.recordStatus === "overdue" ? "negative-value" : ""}`}>
                          {dueNote}
                        </div>
                      )}
                      {record.flexible_until && (
                        <div className="muted-cell">Flexible until {formatDate(record.flexible_until)}</div>
                      )}
                    </td>
                    <td className="numeric">{formatMoney(record.amount, record.currency || "INR")}</td>
                    <td>
                      <span className={`status-pill ${STATUS_PILL_CLASS[record.recordStatus] || ""}`}>
                        {record.recordStatus}
                      </span>
                      {record.priority && (
                        <div className={`muted-cell ${PRIORITY_CLASS[record.priority] || ""}`}>
                          Priority: {record.priority}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
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
          <span>{filtered.length} of {records.length} records · sorted by due date</span>
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
