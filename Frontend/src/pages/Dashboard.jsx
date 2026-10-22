import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  ShieldAlert,
  CalendarClock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import PageHeader from "../components/PageHeader";
import MetricCard from "../components/MetricCard";
import SectionTitle from "../components/SectionTitle";
import { formatMoney, getArray, getInvoiceLabel, getInvoiceDate } from "../lib/financeFormatters";

function Dashboard({ setPage, data, loading, error, onRefresh }) {
  const accounts = getArray(data.accounts);
  const invoices = getArray(data.invoices);
  const obligations = getArray(data.obligations);
  const dailyForecast = data.forecast?.daily_forecast || [];

  // Never add balances from different currencies together.
  const balancesByCurrency = accounts.reduce((result, account) => {
    const currency = account.currency || "INR";
    result[currency] =
      (result[currency] || 0) + Number(account.balance || 0);
    return result;
  }, {});

  const openReceivables = invoices.filter(
    (item) =>
      item.direction === "receivable" &&
      !["paid", "cancelled", "void"].includes(
        String(item.status || "").toLowerCase()
      )
  );

  const openPayables = invoices.filter(
    (item) =>
      item.direction === "payable" &&
      !["paid", "cancelled", "void"].includes(
        String(item.status || "").toLowerCase()
      )
  );

  const receivableTotals = openReceivables.reduce((result, item) => {
    const currency = item.currency || "INR";
    result[currency] = (result[currency] || 0) + Number(item.amount || 0);
    return result;
  }, {});

  const payableTotals = [...openPayables, ...obligations].reduce(
    (result, item) => {
      const currency = item.currency || "INR";
      result[currency] = (result[currency] || 0) + Number(item.amount || 0);
      return result;
    },
    {}
  );

  const reserve = Number(data.company?.minimum_reserve || 0);
  const riskStatus = String(data.risks?.overall_status || "unknown").toLowerCase();
  const riskCount = Number(data.risks?.risk_count || 0);

  // Display the configured reserve currency's forecast only.
  const baseCurrency = data.company?.base_currency || "INR";
  const chartData = dailyForecast
    .filter((item) => item.currency === baseCurrency)
    .slice(0, 14)
    .map((item) => ({
      day: String(item.date).slice(5),
      balance: Number(item.closing_balance || 0),
      inflow: Number(item.expected_inflows || 0),
      outflow: Number(item.expected_outflows || 0),
    }));

  const upcoming = [
    ...invoices.map((item) => ({
      ...item,
      displayType: item.direction === "payable" ? "Payable" : "Receivable",
      displayDate: getInvoiceDate(item),
      displayId: getInvoiceLabel(item),
    })),
    ...obligations.map((item) => ({
      ...item,
      displayType: "Payable",
      displayDate: item.due_date || "No date",
      displayId: `OBL-${item.id}`,
      counterparty: item.category || "Obligation",
    })),
  ]
    .filter((item) => !["paid", "cancelled", "void"].includes(
      String(item.status || "").toLowerCase()
    ))
    .sort((a, b) => String(a.displayDate).localeCompare(String(b.displayDate)))
    .slice(0, 4);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Here's what's happening with your business finances."
        onRefresh={onRefresh}
        loading={loading}
      />

      {loading && !error && (
        <div className="data-banner" role="status" aria-live="polite">
          <span className="notice-dot" />
          <span>Refreshing your financial data…</span>
        </div>
      )}

      {error && (
        <div className="data-banner data-banner-error" role="alert">
          <span className="notice-dot" />
          <div>
            <strong>Some data could not be refreshed</strong>
            <span>{error}</span>
          </div>
          <button className="button button-secondary" onClick={onRefresh} disabled={loading}>
            Try again
          </button>
        </div>
      )}

      <section className="metrics-grid">
        <MetricCard
          title={`Cash balance · ${baseCurrency}`}
          value={loading && !accounts.length ? "Loading…" : formatMoney(balancesByCurrency[baseCurrency] || 0, baseCurrency)}
          change={`${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}`}
          direction="neutral"
          note={`Operating balance · ${baseCurrency}`}
          icon={Wallet}
          tone="blue"
          variant="featured"
        />

        <MetricCard
          title={`Open receivables · ${Object.keys(receivableTotals).length || 0} currencies`}
          value={Object.entries(receivableTotals).map(([currency, amount]) =>
            formatMoney(amount, currency)
          ).join(" · ") || "—"}
          change={`${openReceivables.length} open invoices`}
          direction="positive"
          note="Not guaranteed cash"
          icon={ArrowDownRight}
          tone="green"
        />

        <MetricCard
          title="Open payables"
          value={Object.entries(payableTotals).map(([currency, amount]) =>
            formatMoney(amount, currency)
          ).join(" · ") || "—"}
          change={`${openPayables.length + obligations.length} records`}
          direction="negative"
          note="Invoices plus obligations"
          icon={ArrowUpRight}
          tone="amber"
        />

        <MetricCard
          title="Liquidity risk"
          value={riskStatus === "unknown" ? "Unknown" : riskStatus.toUpperCase()}
          change={`${riskCount} reported risk records`}
          direction={riskStatus === "critical" ? "negative" : "neutral"}
          note={`Configured reserve: ${formatMoney(reserve, baseCurrency)}`}
          icon={ShieldAlert}
          tone={riskStatus === "critical" ? "red" : "purple"}
        />
      </section>

      <section className="content-grid chart-content-grid">
        <article className="panel cash-panel">
          <SectionTitle
            title={`Cash flow forecast · ${baseCurrency}`}
            subtitle="Closing balance with expected incoming and outgoing cash"
            action="View forecast"
            onAction={() => setPage("forecast")}
          />

          {chartData.length > 0 ? (
            <>
              <div className="chart-legend-note">
                <span className="legend-dot blue-dot" /> Closing balance
                <span className="legend-dot green-dot" /> Incoming
                <span className="legend-dot amber-dot" /> Outgoing
              </div>

              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="liveBalanceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5688ff" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#5688ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#263449" strokeDasharray="4 5" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#8998ae", fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: "#8998ae", fontSize: 11 }}
                      tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111c30",
                        border: "1px solid #293850",
                        borderRadius: 12,
                        color: "#f0f5ff",
                      }}
                      formatter={(value, name) => [
                        formatMoney(value, baseCurrency),
                        name === "balance" ? "Closing balance" :
                        name === "inflow" ? "Incoming" : "Outgoing",
                      ]}
                    />
                    {reserve > 0 && (
                      <ReferenceLine
                        y={reserve}
                        stroke="#e7ad55"
                        strokeDasharray="5 5"
                        label={{ value: "Reserve", fill: "#e7ad55", fontSize: 11 }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#6590ff"
                      fill="url(#liveBalanceFill)"
                      name="balance"
                    />
                    <Area
                      type="monotone"
                      dataKey="inflow"
                      stroke="#27c997"
                      fill="transparent"
                      name="inflow"
                    />
                    <Area
                      type="monotone"
                      dataKey="outflow"
                      stroke="#e7ad55"
                      fill="transparent"
                      name="outflow"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footer">
                <span><span className="live-dot" /> Live API forecast</span>
                <span>Currency: {baseCurrency}</span>
              </div>
            </>
          ) : (
            <div className="empty-state">
              {loading
                ? "Loading forecast…"
                : `No forecast rows available for ${baseCurrency}. Check the API response.`}
            </div>
          )}
        </article>

        <article className="panel health-panel">
          <SectionTitle
            title="Financial health"
            subtitle="Liquidity status from risk analysis"
          />
          <div className={`health-summary ${riskStatus === "critical" ? "health-summary-critical" : riskStatus === "unknown" ? "health-summary-unknown" : "health-summary-stable"}`}>
            <div className="health-icon"><ShieldAlert size={21} /></div>
            <div>
              <span>Current status</span>
              <strong>{riskStatus === "unknown" ? "Unavailable" : riskStatus}</strong>
            </div>
          </div>
          <div className="health-status">
            <span className={`status-dot ${riskStatus === "unknown" ? "status-dot-neutral" : riskStatus === "critical" ? "" : "green-bg"}`} />
            <strong>{riskCount} risk {riskCount === 1 ? "record" : "records"} reported</strong>
          </div>
          <p className="health-description">
            Review the forecast and risk records for the details behind this status.
          </p>
          <div className="health-row">
            <span>Configured minimum reserve</span>
            <strong>{formatMoney(reserve, baseCurrency)}</strong>
          </div>
          <div className="health-row">
            <span>Other account currencies</span>
            <strong>{Object.keys(balancesByCurrency).filter((c) => c !== baseCurrency).join(", ") || "None"}</strong>
          </div>
        </article>
      </section>

      <section className="content-grid lower-grid">
        <article className="panel">
          <SectionTitle
            title="Upcoming payments"
            subtitle="Open invoices and obligations from the API"
            action="View invoices"
            onAction={() => setPage("invoices")}
          />
          <div className="payment-list">
            {upcoming.map((item) => {
              const currency = item.currency || baseCurrency;
              const isReceivable = item.displayType === "Receivable";

              return (
                <div className="payment-row" key={`${item.displayType}-${item.id}`}>
                  <div className={`payment-icon ${isReceivable ? "payment-in" : "payment-out"}`}>
                    {isReceivable ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div className="payment-info">
                    <strong>{item.counterparty || item.client || item.category || "Payment"}</strong>
                    <span>{item.displayId} · {item.displayDate}</span>
                  </div>
                  <div className="payment-amount">
                    <strong>{formatMoney(item.amount, currency)}</strong>
                    <span className={`status-pill ${isReceivable ? "status-green" : "status-amber"}`}>
                      {item.status || item.priority || item.displayType}
                    </span>
                  </div>
                </div>
              );
            })}
            {!upcoming.length && (
              <div className="empty-state">
                {loading ? "Loading payments…" : "No open invoices or obligations found."}
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <SectionTitle
            title="Risk alerts"
            subtitle="Risk records reported by your backend"
            action="View risks"
            onAction={() => setPage("risk")}
          />
          <div className="risk-list">
            {(data.risks?.risks || data.risks?.alerts || []).slice(0, 4).map((risk, index) => {
              const level = String(risk.severity || risk.level || "medium").toLowerCase();

              return (
                <div className="risk-row" key={risk.id || `${risk.title}-${index}`}>
                  <div className={`risk-indicator risk-${level === "critical" ? "high" : level}`}>
                    <ShieldAlert size={17} />
                  </div>
                  <div className="risk-copy">
                    <div>
                      <strong>{risk.title || risk.message || "Liquidity risk"}</strong>
                      <span className={`risk-tag tag-${level === "critical" ? "high" : level}`}>
                        {level}
                      </span>
                    </div>
                    <p>{risk.detail || risk.description || risk.message || "Review the forecast for details."}</p>
                    <small><CalendarClock size={13} /> {risk.date || risk.forecast_date || ""}</small>
                  </div>
                </div>
              );
            })}
            {!((data.risks?.risks || data.risks?.alerts || []).length) && (
              <div className="empty-state">
                {loading
                  ? "Loading risk alerts…"
                  : `Overall status: ${riskStatus}. ${riskCount} risk records reported.`}
              </div>
            )}
          </div>
        </article>
      </section>
    </>
  );
}

export default Dashboard;
