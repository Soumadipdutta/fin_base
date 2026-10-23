import { useState } from "react";
import {
  LayoutDashboard,
  Brain,
  ChartNoAxesCombined,
  ReceiptText,
  ShieldAlert,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CircleDollarSign,
  CalendarClock,
  ChevronRight,
  Menu,
  X,
  Download,
  RefreshCw,
  CircleHelp,
  SlidersHorizontal,
  Bot,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import "./App.css";
import { useEffect } from "react";
import { testCompanyApi } from "./lib/testApi";
import { useDashboardData } from "./hooks/useDashboardData";
import { useForecastData } from "./hooks/useForecastData";
import { useInvoicesData } from "./hooks/useInvoicesData";
import { useRiskData } from "./hooks/useRiskData";
import { useApiStatus } from "./hooks/useApiStatus";
import Copilot from "./pages/Copilot.jsx";
import MemoryManager from "./pages/MemoryManager";
import ScenarioPlanner from "./components/ScenarioPlanner";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "forecast", label: "Cash Flow Forecast", icon: ChartNoAxesCombined },
  { id: "invoices", label: "Invoices & Payments", icon: ReceiptText },
  { id: "risk", label: "Risk & Simulation", icon: ShieldAlert },
  { id: "copilot", label: "AI Copilot", icon: Bot },
  { id: "scenarios", label: "What-if Planner", icon: SlidersHorizontal},
];

const demoCashFlow = [
  { day: "Oct 13", inflow: 32000, outflow: 18000, balance: 85000 },
  { day: "Oct 15", inflow: 24000, outflow: 26000, balance: 83000 },
  { day: "Oct 17", inflow: 41000, outflow: 22000, balance: 102000 },
  { day: "Oct 19", inflow: 18000, outflow: 31000, balance: 89000 },
  { day: "Oct 21", inflow: 52000, outflow: 28000, balance: 113000 },
  { day: "Oct 23", inflow: 35000, outflow: 42000, balance: 106000 },
  { day: "Oct 25", inflow: 46000, outflow: 24000, balance: 128000 },
];

const demoInvoices = [
  { id: "INV-1042", client: "Acme Technologies", type: "Receivable", amount: 85000, date: "Oct 15, 2026", status: "Expected" },
  { id: "INV-1041", client: "CloudNine Inc.", type: "Receivable", amount: 62000, date: "Oct 18, 2026", status: "Pending" },
  { id: "BILL-208", client: "AWS Services", type: "Payable", amount: 18500, date: "Oct 16, 2026", status: "Due soon" },
  { id: "BILL-207", client: "Marketing Studio", type: "Payable", amount: 24000, date: "Oct 20, 2026", status: "Scheduled" },
];

const demoRisks = [
  { level: "High", title: "Reserve pressure detected", detail: "Projected cash may fall below your reserve threshold.", date: "Next 7 days" },
  { level: "Medium", title: "Receivable timing uncertainty", detail: "An expected international payment may arrive late.", date: "Next 14 days" },
  { level: "Low", title: "Upcoming obligation", detail: "A scheduled vendor payment is approaching.", date: "Oct 20, 2026" },
];


function formatMoney(value, currency = "INR") {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function getArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.accounts)) return response.accounts;
  if (Array.isArray(response?.invoices)) return response.invoices;
  if (Array.isArray(response?.obligations)) return response.obligations;
  if (Array.isArray(response?.daily_forecast)) return response.daily_forecast;
  return [];
}

function getInvoiceLabel(invoice) {
  return invoice.invoice_number || invoice.reference || `INV-${invoice.id}`;
}

function getInvoiceDate(invoice) {
  return invoice.expected_date || invoice.due_date || invoice.issue_date || "No date";
}


function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function Sidebar({ page, setPage, open, close }) {
  return (
    <>
      {open && <button className="mobile-overlay" onClick={close} aria-label="Close navigation" />}
      <aside
  className={`sidebar ${open ? "sidebar-open" : ""}`}
>
        <div className="brand">
          <div className="brand-mark"><CircleDollarSign size={24} /></div>
          <div>
            <div className="brand-name">FlowPilot</div>
            <div className="brand-subtitle">FINANCIAL INTELLIGENCE</div>
          </div>
          <button className="icon-button mobile-close" onClick={close} aria-label="Close menu"><X size={19} /></button>
        </div>
        
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace">
          <div className="workspace-avatar">S</div>
          <div className="workspace-copy">
            <strong>Startup workspace</strong>
            <span>Demo environment</span>
          </div>
          <ChevronRight size={16} className="muted-icon" />
        </div>
        
        <div className="nav-label">OVERVIEW</div>
        <nav className="navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-link ${page === id ? "nav-link-active" : ""}`}
              onClick={() => { setPage(id); close(); }}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {id === "risk" && <span className="nav-count">2</span>}
            </button>

            
          ))}
        </nav>
        <button
  className={`nav-link ${page === "memory" ? "nav-link-active" : ""}`}
  onClick={() => {
    setPage("memory");
    close();
  }}
>
  <Brain size={19} strokeWidth={1.8} />
  <span>Memory</span>
</button>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><CircleHelp size={19} /></div>
            <strong>Need a hand?</strong>
            <p>Explore your cash flow with confidence.</p>
            <button onClick={() => setPage("forecast")}>Explore forecasts <ArrowUpRight size={14} /></button>
          </div>
          <div className="profile">
            <div className="profile-avatar">SD</div>
            <div className="profile-copy"><strong>Workspace Admin</strong><span>Administrator</span></div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
    </>
  );
}

function PageHeader({ title, description, onRefresh }) {
  const { status: apiStatus, checkStatus } = useApiStatus();
  return (
    <header className="page-header">
      <div className="header-title">
        <span className="eyebrow">FINANCIAL OVERVIEW</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      
      <div className={`api-status api-status-${apiStatus}`}>
  <span className="api-status-dot" />

  <span>
    {apiStatus === "connected"
      ? "API connected"
      : apiStatus === "checking"
        ? "Checking API..."
        : "API disconnected"}
  </span>

  <button
    type="button"
    onClick={checkStatus}
    className="api-status-refresh"
    title="Check API connection"
  >
    <RefreshCw size={14} />
  </button>
</div>

      <div className="header-actions">
        <span className="demo-badge"><span /> DEMO DATA</span>
        <button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><i /></button>
        <button className="button button-secondary" onClick={onRefresh}><RefreshCw size={15} /> Refresh view</button>
      </div>

      
    </header>
  );
}

function MetricCard({ title, value, change, direction, icon: Icon, tone, note }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <div className={`metric-icon ${tone}`}><Icon size={19} /></div>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-bottom">
        <span className={`metric-change ${direction}`}>
          {direction === "positive" ? <ArrowUpRight size={15} /> : direction === "negative" ? <ArrowDownRight size={15} /> : null}
          {change}
        </span>
        <span className="metric-note">{note}</span>
      </div>
    </article>
  );
}

function CashFlowChart({ forecast = false }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={demoCashFlow} margin={{ top: 12, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5688ff" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#5688ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="inflowFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#27c997" stopOpacity={0.17} />
              <stop offset="100%" stopColor="#27c997" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#263449" strokeDasharray="4 5" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#8998ae", fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
          <YAxis
            tick={{ fill: "#8998ae", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            contentStyle={{ background: "#111c30", border: "1px solid #293850", borderRadius: 12, color: "#f0f5ff" }}
            labelStyle={{ color: "#aab8cc", marginBottom: 6 }}
            formatter={(v, name) => [money(v), name === "balance" ? "Closing balance" : name === "inflow" ? "Incoming" : "Outgoing"]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#aab8cc", paddingTop: 12 }} />
          {forecast && <ReferenceLine y={50000} stroke="#e7ad55" strokeDasharray="5 5" label={{ value: "Reserve", fill: "#e7ad55", fontSize: 11, position: "insideTopRight" }} />}
          <Area type="monotone" dataKey="balance" name="balance" stroke="#6590ff" strokeWidth={2.5} fill="url(#balanceFill)" />
          <Area type="monotone" dataKey="inflow" name="inflow" stroke="#27c997" strokeWidth={2} fill="url(#inflowFill)" />
          <Area type="monotone" dataKey="outflow" name="outflow" stroke="#e7ad55" strokeWidth={2} fill="transparent" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function SectionTitle({ title, subtitle, action, onAction }) {
  return (
    <div className="section-heading">
      <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      {action && <button className="text-action" onClick={onAction}>{action} <ArrowUpRight size={15} /></button>}
    </div>
  );
}


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
  const riskStatus = String(data.risks?.overall_status || "unknown");
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
      />

      <div className="demo-notice">
        <span className="notice-dot" />
        <div>
          <strong>{loading ? "Loading live data" : "Backend-connected dashboard"}</strong>
          <span>
            {loading
              ? "Fetching your company financial data."
              : "Metrics below use your API responses. Balances remain separated by currency."}
          </span>
        </div>
        <button
          className="button button-secondary"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh data"}
        </button>
      </div>

      {error && (
        <div className="demo-notice">
          <span className="notice-dot" />
          <div>
            <strong>Some data could not be refreshed</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <section className="metrics-grid">
        <MetricCard
          title={`Cash balance · ${baseCurrency}`}
          value={formatMoney(balancesByCurrency[baseCurrency] || 0, baseCurrency)}
          change="Live account balance"
          direction="neutral"
          note={data.company?.name || "Company account"}
          icon={Wallet}
          tone="blue"
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
            subtitle="Daily forecast returned by your backend"
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
                    <ReferenceLine
                      y={reserve}
                      stroke="#e7ad55"
                      strokeDasharray="5 5"
                      label={{ value: "Reserve", fill: "#e7ad55", fontSize: 11 }}
                    />
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
            subtitle="Based on the backend's current risk status"
          />
          <div className="health-ring-wrap">
            <div className="health-ring">
              <div>
                <strong>{riskStatus === "unknown" ? "—" : riskStatus === "critical" ? "!" : "✓"}</strong>
                <small>Risk status</small>
              </div>
            </div>
          </div>
          <div className="health-status">
            <span className={`status-dot ${riskStatus === "critical" ? "" : "green-bg"}`} />
            <strong>{riskStatus === "unknown" ? "Status unavailable" : `${riskStatus} liquidity risk`}</strong>
          </div>
          <p className="health-description">
            This status comes from the backend risk endpoint. It is not an invented health score.
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


function Forecast({ onRefresh }) {
  const {
    days,
    setDays,
    forecast,
    loading,
    error,
    refresh,
  } = useForecastData(30);

  const [currency, setCurrency] = useState("INR");

  const rows = (forecast?.daily_forecast || []).filter(
    (item) => item.currency === currency
  );

  const currencies = [
    ...new Set(
      (forecast?.daily_forecast || []).map((item) => item.currency)
    ),
  ];

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  return (
    <>
      <PageHeader
        title="Cash Flow Forecast"
        description="Explore projected balances, incoming funds, outgoing payments, and reserve shortfalls."
        onRefresh={refresh}
      />

      <section className="panel forecast-controls">
        <div>
          <span className="field-label">Forecast horizon</span>
          <div className="segmented-control">
            {[30, 60, 90].map((option) => (
              <button
                key={option}
                className={days === option ? "active" : ""}
                onClick={() => setDays(option)}
              >
                {option} days
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="field-label">Currency</span>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {currencies.includes(currency) ? null : (
              <option value={currency}>{currency}</option>
            )}
            {currencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <div className="panel error-panel">
          <strong>Forecast could not be loaded</strong>
          <p>{error}</p>
          <button className="button button-secondary" onClick={refresh}>
            Try again
          </button>
        </div>
      )}

      <section className="metrics-grid forecast-metrics">
        <MetricCard
          title="Opening balance"
          value={rows.length ? money(rows[0].opening_balance) : "—"}
          note={`First forecast day · ${currency}`}
          icon={Wallet}
          tone="blue"
        />
        <MetricCard
          title="Projected closing balance"
          value={rows.length ? money(rows[rows.length - 1].closing_balance) : "—"}
          note={`Final day of ${days}-day forecast`}
          icon={CircleDollarSign}
          tone="green"
        />
        <MetricCard
          title="Total expected inflows"
          value={money(rows.reduce((sum, row) => sum + Number(row.expected_inflows || 0), 0))}
          note="Forecast-period receipts"
          icon={ArrowDownRight}
          tone="green"
        />
        <MetricCard
          title="Total expected outflows"
          value={money(rows.reduce((sum, row) => sum + Number(row.expected_outflows || 0), 0))}
          note="Forecast-period payments"
          icon={ArrowUpRight}
          tone="amber"
        />
      </section>

      <section className="panel forecast-chart-panel">
        <SectionTitle
          title={`${days}-day projected balance`}
          subtitle={`Daily forecast values in ${currency}. This is a projection, not a guarantee.`}
        />

        {loading ? (
          <div className="empty-state">Loading forecast…</div>
        ) : rows.length ? (
          <div className="chart-wrap forecast-large-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={rows}
                margin={{ top: 12, right: 12, left: 12, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="#263449"
                  strokeDasharray="4 5"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8998ae", fontSize: 11 }}
                  tickFormatter={(value) => value.slice(5)}
                  minTickGap={28}
                />
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
                    money(value),
                    name === "closing_balance"
                      ? "Closing balance"
                      : name === "expected_inflows"
                        ? "Expected inflows"
                        : name === "expected_outflows"
                          ? "Expected outflows"
                          : name,
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <ReferenceLine
                  y={Number(forecast?.minimum_reserve || 0)}
                  stroke="#e7ad55"
                  strokeDasharray="5 5"
                  label={{ value: "Reserve", fill: "#e7ad55", fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="closing_balance"
                  stroke="#6790ff"
                  fill="#6790ff"
                  fillOpacity={0.14}
                  name="closing_balance"
                />
                <Area
                  type="monotone"
                  dataKey="expected_inflows"
                  stroke="#27c997"
                  fill="transparent"
                  name="expected_inflows"
                />
                <Area
                  type="monotone"
                  dataKey="expected_outflows"
                  stroke="#e7ad55"
                  fill="transparent"
                  name="expected_outflows"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-state">
            No forecast rows are available for {currency}.
          </div>
        )}
      </section>

      <section className="panel forecast-table-panel">
        <SectionTitle
          title="Daily breakdown"
          subtitle="Values are kept in their original currency."
        />
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Opening</th>
                <th>Inflows</th>
                <th>Outflows</th>
                <th>Closing</th>
                <th>Reserve shortfall</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.date}-${row.currency}`}>
                  <td>{row.date}</td>
                  <td>{money(row.opening_balance)}</td>
                  <td>{money(row.expected_inflows)}</td>
                  <td>{money(row.expected_outflows)}</td>
                  <td className={Number(row.closing_balance) < 0 ? "negative-value" : ""}>
                    {money(row.closing_balance)}
                  </td>
                  <td>
                    {row.reserve_shortfall == null
                      ? "—"
                      : money(row.reserve_shortfall)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

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

function Risk() {
  const {
    risks,
    simulation,
    optimization,
    loading,
    simulationLoading,
    optimizationLoading,
    error,
    refreshRisks,
    runSimulation,
    loadOptimization,
  } = useRiskData();

  const [currency, setCurrency] = useState("INR");

  const currencyResults = (simulation?.currency_results || simulation?.results || [])
    .filter((item) => !item.currency || item.currency === currency);

  const probability = (value) =>
    value == null
      ? "—"
      : `${(Number(value) * 100).toFixed(1)}%`;

  const money = (value) =>
    value == null
      ? "—"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        }).format(Number(value));

  const dailyRisks = risks?.daily_risks || risks?.risks || risks?.alerts || [];

  return (
    <>
      <PageHeader
        title="Risk & Simulation"
        description="Inspect liquidity warnings, run cash-flow scenarios, and review optimization output."
        onRefresh={refreshRisks}
      />

      {error && (
        <div className="panel error-panel">
          <strong>Some risk data could not be loaded</strong>
          <p>{String(error)}</p>
          <button className="button button-secondary" onClick={refreshRisks}>
            Retry risk data
          </button>
        </div>
      )}

      <section className="metrics-grid">
        <MetricCard
          title="Overall risk status"
          value={String(risks?.overall_status || "Unknown").toUpperCase()}
          note="Status returned by backend"
          icon={ShieldAlert}
          tone={risks?.overall_status === "critical" ? "red" : "amber"}
        />
        <MetricCard
          title="Reported risk records"
          value={risks?.risk_count ?? "—"}
          note="Records returned by risk analysis"
          icon={Bell}
          tone="amber"
        />
        <MetricCard
          title="Monte Carlo runs"
          value={simulation?.simulations ?? simulation?.simulation_count ?? "—"}
          note={simulation ? "Simulation response received" : "Run a simulation below"}
          icon={ChartNoAxesCombined}
          tone="blue"
        />
        <MetricCard
          title="Schedule validation"
          value={
            optimization?.schedule_validation?.is_safe == null
              ? "Not checked"
              : optimization.schedule_validation.is_safe
                ? "Safe"
                : "Breaches found"
          }
          note="Backend schedule validation"
          icon={ShieldAlert}
          tone={optimization?.schedule_validation?.is_safe ? "green" : "red"}
        />
      </section>

      <section className="content-grid risk-main-grid">
        <article className="panel">
          <SectionTitle
            title="Monte Carlo simulation"
            subtitle="Test how uncertain invoice receipt timing affects projected liquidity."
          />

          <div className="risk-toolbar">
            <label>
              <span className="field-label">Currency</span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            </label>

            <button
              className="button button-primary"
              onClick={runSimulation}
              disabled={simulationLoading}
            >
              {simulationLoading ? "Running…" : "Run simulation"}
            </button>
          </div>

          {currencyResults.length > 0 ? (
            <div className="scenario-grid">
              {currencyResults.map((result, index) => (
                <div className="scenario-card" key={result.currency || index}>
                  <span className="field-label">
                    {result.currency || currency} scenario
                  </span>
                  <strong>
                    {probability(result.probability_ever_below_zero)}
                  </strong>
                  <p>Probability of going below zero</p>
                  <div className="scenario-divider" />
                  <span className="field-label">Reserve breach probability</span>
                  <strong>
                    {probability(result.probability_ever_below_reserve)}
                  </strong>
                  <p>Probability of falling below configured reserve</p>
                  <div className="scenario-divider" />
                  <span className="field-label">Worst observed shortfall</span>
                  <strong>
                    {result.worst_shortfall_observed == null
                      ? "—"
                      : money(result.worst_shortfall_observed)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {simulationLoading
                ? "Running simulation…"
                : "Run the simulation to view the returned scenario metrics."}
            </div>
          )}

          {simulation?.limitations?.length > 0 && (
            <div className="limitations">
              <strong>Simulation limitations</strong>
              <ul>
                {simulation.limitations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </article>

        <article className="panel">
          <SectionTitle
            title="Optimization recommendations"
            subtitle="Review proposed payment changes and schedule validation."
          />

          <button
            className="button button-secondary"
            onClick={loadOptimization}
            disabled={optimizationLoading}
          >
            {optimizationLoading ? "Checking…" : "Check payment schedule"}
          </button>

          {optimization && (
            <>
              <div className="optimization-status">
                <span>Schedule validation</span>
                <strong>
                  {optimization.schedule_validation?.is_safe
                    ? "No reported breaches"
                    : `${optimization.schedule_validation?.breach_count ?? 0} breaches`}
                </strong>
              </div>

              {(optimization.recommendations || []).length ? (
                <div className="recommendation-list">
                  {optimization.recommendations.map((item, index) => (
                    <div className="recommendation-row" key={item.id || index}>
                      <div>
                        <strong>
                          {item.description ||
                            item.reason ||
                            `Recommendation ${index + 1}`}
                        </strong>
                        <p>
                          {item.currency || currency}
                          {item.amount != null ? ` · ${money(item.amount)}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  The backend returned no payment recommendations. This does
                  not mean the schedule is safe.
                </div>
              )}

              {optimization.limitations?.length > 0 && (
                <div className="limitations">
                  <strong>Optimization limitations</strong>
                  <ul>
                    {optimization.limitations.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </article>
      </section>

      <section className="panel risk-records-panel">
        <SectionTitle
          title="Risk records"
          subtitle="Review risk entries returned by the backend."
        />

        {loading ? (
          <div className="empty-state">Loading risk records…</div>
        ) : dailyRisks.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Currency</th>
                  <th>Severity</th>
                  <th>Closing balance</th>
                  <th>Reserve shortfall</th>
                </tr>
              </thead>
              <tbody>
                {dailyRisks.map((item, index) => (
                  <tr key={item.id || `${item.date}-${item.currency}-${index}`}>
                    <td>{item.date || item.forecast_date || "—"}</td>
                    <td>{item.currency || "—"}</td>
                    <td>
                      <span className="status-pill status-amber">
                        {item.severity || item.level || "Unspecified"}
                      </span>
                    </td>
                    <td>
                      {item.closing_balance == null
                        ? "—"
                        : new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: item.currency || currency,
                            maximumFractionDigits: 2,
                          }).format(Number(item.closing_balance))}
                    </td>
                    <td>
                      {item.reserve_shortfall == null
                        ? "—"
                        : new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: item.currency || currency,
                            maximumFractionDigits: 2,
                          }).format(Number(item.reserve_shortfall))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            No detailed risk rows were found in the risk response. Check the
            response schema in Swagger if you expect individual records.
          </div>
        )}
      </section>
    </>
  );
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // const { status: apiStatus, checkStatus } = useApiStatus();

  useEffect(() => {
  testCompanyApi();
  }, []);
  const dashboardData = useDashboardData();
  const titles = {
    dashboard: "Dashboard",
    forecast: "Cash flow forecast",
    invoices: "Invoices & payments",
    risk: "Risk & simulation",
    copilot: "AI Copilot",
  };

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} open={mobileNavOpen} close={() => setMobileNavOpen(false)} />
      <main className="main-area">
        <div className="mobile-topbar">
          <button className="icon-button" onClick={() => setMobileNavOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
          <strong>FlowPilot</strong>
          <span className="mobile-page-title">{titles[page]}</span>
        </div>
        <div className="page-content">
          {page === "dashboard" && (
  <Dashboard
    setPage={setPage}
    data={dashboardData}
    loading={dashboardData.loading}
    error={dashboardData.error}
    onRefresh={dashboardData.refresh}
  />
)}
          {page === "forecast" && <Forecast />}
          {page === "invoices" && <Invoices />}
          {page === "risk" && <Risk />}
          {page === "copilot" && <Copilot />}
          {page === "scenarios" && <ScenarioPlanner />}
          <footer className="app-footer"><span>FlowPilot <span className="footer-separator">/</span> Financial intelligence for growing teams</span><span>Balances stay in their original currencies</span></footer>
          {page === "memory" && <MemoryManager /> }
          


          <footer className="app-footer"><span>FlowPilot <span className="footer-separator">/</span> Financial intelligence for growing teams</span><span>Dark mode <span className="footer-dot" /></span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
