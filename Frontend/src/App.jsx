
import { useState } from "react";
import {
  LayoutDashboard,
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

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "forecast", label: "Cash Flow Forecast", icon: ChartNoAxesCombined },
  { id: "invoices", label: "Invoices & Payments", icon: ReceiptText },
  { id: "risk", label: "Risk & Simulation", icon: ShieldAlert },
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
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
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
  return (
    <header className="page-header">
      <div className="header-title">
        <span className="eyebrow">FINANCIAL OVERVIEW</span>
        <h1>{title}</h1>
        <p>{description}</p>
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

function Dashboard({ setPage }) {
  return (
    <>
      <PageHeader title="Dashboard" description="Here's what's happening with your business finances." onRefresh={() => window.location.reload()} />
      <div className="demo-notice"><span className="notice-dot" /><div><strong>Preview environment</strong><span>Figures on this page are illustrative demo data, not live account balances.</span></div></div>

      <section className="metrics-grid">
        <MetricCard title="Total cash balance" value={money(485000)} change="4.8%" direction="positive" note="vs. last month" icon={Wallet} tone="blue" />
        <MetricCard title="Expected receivables" value={money(247000)} change="12.3%" direction="positive" note="next 30 days" icon={ArrowDownRight} tone="green" />
        <MetricCard title="Upcoming payables" value={money(126500)} change="8.1%" direction="negative" note="next 30 days" icon={ArrowUpRight} tone="amber" />
        <MetricCard title="Reserve health" value="Healthy" change="Above target" direction="positive" note="illustrative status" icon={ShieldAlert} tone="purple" />
      </section>

      <section className="content-grid chart-content-grid">
        <article className="panel cash-panel">
          <SectionTitle title="Cash flow overview" subtitle="Illustrative inflows, outflows and projected balance" action="View forecast" onAction={() => setPage("forecast")} />
          <div className="chart-legend-note"><span className="legend-dot blue-dot" /> Closing balance <span className="legend-dot green-dot" /> Incoming <span className="legend-dot amber-dot" /> Outgoing</div>
          <CashFlowChart />
          <div className="chart-footer"><span><span className="live-dot" /> Sample 14-day view</span><span>Values in INR</span></div>
        </article>

        <article className="panel health-panel">
          <SectionTitle title="Financial health" subtitle="A quick look at your cash position" />
          <div className="health-ring-wrap">
            <div className="health-ring"><div><strong>78<span>/100</span></strong><small>Health score</small></div></div>
          </div>
          <div className="health-status"><span className="status-dot green-bg" /><strong>Good financial position</strong></div>
          <p className="health-description">Illustrative score only. It is not yet calculated from your live accounts.</p>
          <div className="health-row"><span>Cash reserve coverage</span><strong>24 days</strong></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: "72%" }} /></div>
          <div className="health-row"><span>Receivables collection</span><strong>81%</strong></div>
          <div className="progress-track"><div className="progress-fill green-fill" style={{ width: "81%" }} /></div>
        </article>
      </section>

      <section className="content-grid lower-grid">
        <article className="panel">
          <SectionTitle title="Upcoming payments" subtitle="Illustrative transactions to keep an eye on" action="View invoices" onAction={() => setPage("invoices")} />
          <div className="payment-list">
            {demoInvoices.slice(0, 3).map((invoice) => (
              <div className="payment-row" key={invoice.id}>
                <div className={`payment-icon ${invoice.type === "Receivable" ? "payment-in" : "payment-out"}`}>
                  {invoice.type === "Receivable" ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="payment-info"><strong>{invoice.client}</strong><span>{invoice.id} · {invoice.date}</span></div>
                <div className="payment-amount"><strong>{money(invoice.amount)}</strong><span className={`status-pill ${invoice.type === "Receivable" ? "status-green" : "status-amber"}`}>{invoice.status}</span></div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <SectionTitle title="Risk alerts" subtitle="Items that may need your attention" action="View risks" onAction={() => setPage("risk")} />
          <div className="risk-list">
            {demoRisks.slice(0, 2).map((risk) => (
              <div className="risk-row" key={risk.title}>
                <div className={`risk-indicator risk-${risk.level.toLowerCase()}`}><ShieldAlert size={17} /></div>
                <div className="risk-copy"><div><strong>{risk.title}</strong><span className={`risk-tag tag-${risk.level.toLowerCase()}`}>{risk.level}</span></div><p>{risk.detail}</p><small><CalendarClock size={13} /> {risk.date}</small></div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function Forecast({ setPage }) {
  const [horizon, setHorizon] = useState("30 days");
  return (
    <>
      <PageHeader title="Cash flow forecast" description="Understand how expected money movements may affect future liquidity." onRefresh={() => window.location.reload()} />
      <div className="demo-notice"><span className="notice-dot" /><div><strong>Illustrative forecast</strong><span>This preview uses sample data. The live forecast API will be connected next.</span></div></div>
      <section className="metrics-grid three-metrics">
        <MetricCard title="Projected closing balance" value={money(485000)} change="Sample estimate" direction="positive" note="selected horizon" icon={Wallet} tone="blue" />
        <MetricCard title="Expected inflows" value={money(248000)} change="7 events" direction="positive" note="sample transactions" icon={ArrowDownRight} tone="green" />
        <MetricCard title="Expected outflows" value={money(191000)} change="5 events" direction="negative" note="sample transactions" icon={ArrowUpRight} tone="amber" />
      </section>
      <article className="panel forecast-panel">
        <div className="forecast-toolbar">
          <SectionTitle title="Projected cash position" subtitle="Sample daily cash movement and closing balance" />
          <div className="segmented-control">
            {["30 days", "60 days", "90 days"].map((item) => <button key={item} className={horizon === item ? "segment-active" : ""} onClick={() => setHorizon(item)}>{item}</button>)}
          </div>
        </div>
        <CashFlowChart forecast />
        <div className="reserve-explanation"><span className="legend-dot amber-dot" /><div><strong>Minimum reserve reference: ₹50,000</strong><p>The threshold is illustrative; the forecast endpoint will use your company's configured reserve.</p></div></div>
      </article>
      <article className="panel next-step-panel"><div className="next-step-icon"><ChartNoAxesCombined size={21} /></div><div><strong>Connect the live forecast</strong><p>Next, we'll load the company's daily forecast from the FlowPilot API and use the selected horizon to filter the chart.</p></div><button className="button button-secondary" onClick={() => setPage("invoices")}>Explore invoices <ChevronRight size={16} /></button></article>
    </>
  );
}

function Invoices() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const filtered = demoInvoices.filter((item) =>
    (filter === "All" || item.type === filter) &&
    `${item.id} ${item.client} ${item.status}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <PageHeader title="Invoices & payments" description="Track incoming payments and outgoing obligations in one place." onRefresh={() => { setSearch(""); setFilter("All"); }} />
      <div className="demo-notice"><span className="notice-dot" /><div><strong>Sample invoice register</strong><span>These rows are illustrative. Create, update and database persistence will be connected to the API.</span></div></div>
      <section className="metrics-grid three-metrics">
        <MetricCard title="Total receivables" value={money(247000)} change="2 sample invoices" direction="positive" note="awaiting collection" icon={ArrowDownRight} tone="green" />
        <MetricCard title="Total payables" value={money(126500)} change="2 sample bills" direction="negative" note="scheduled obligations" icon={ArrowUpRight} tone="amber" />
        <MetricCard title="Due this week" value={money(43500)} change="Needs review" direction="neutral" note="sample amount" icon={CalendarClock} tone="purple" />
      </section>
      <article className="panel invoices-panel">
        <SectionTitle title="Invoice register" subtitle={`${filtered.length} sample records`} />
        <div className="table-toolbar">
          <div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices or clients..." /></div>
          <div className="filter-tabs">{["All", "Receivable", "Payable"].map((item) => <button key={item} className={filter === item ? "filter-active" : ""} onClick={() => setFilter(item)}>{item === "Receivable" ? "Receivables" : item === "Payable" ? "Payables" : item}</button>)}</div>
          <button className="button button-secondary" onClick={() => window.alert("Invoice creation will be enabled when the API form is connected.")}>+ New invoice</button>
        </div>
        <div className="table-scroll"><table className="invoice-table">
          <thead><tr><th>INVOICE</th><th>CLIENT / VENDOR</th><th>TYPE</th><th>DUE DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
          <tbody>{filtered.map((item) => <tr key={item.id}>
            <td><strong className="invoice-id">{item.id}</strong></td>
            <td><strong>{item.client}</strong></td>
            <td><span className={`type-label ${item.type === "Receivable" ? "type-in" : "type-out"}`}>{item.type}</span></td>
            <td>{item.date}</td>
            <td className="amount-cell">{money(item.amount)}</td>
            <td><span className={`status-pill ${item.type === "Receivable" ? "status-green" : "status-amber"}`}>{item.status}</span></td>
          </tr>)}</tbody>
        </table></div>
        {filtered.length === 0 && <div className="empty-state">No sample invoices match your search.</div>}
        <div className="table-footer"><span>Sample records · Not persisted</span><button className="text-action" onClick={() => window.alert("CSV export will be added with the live invoice API.")}><Download size={15} /> Export</button></div>
      </article>
    </>
  );
}

function Risk({ setPage }) {
  return (
    <>
      <PageHeader title="Risk & simulation" description="Explore potential liquidity risks and understand what could happen under uncertainty." onRefresh={() => window.location.reload()} />
      <div className="demo-notice"><span className="notice-dot" /><div><strong>Simulation preview</strong><span>Sample visualizations only. The Monte Carlo endpoint will provide real scenario results from your backend.</span></div></div>
      <section className="metrics-grid three-metrics">
        <MetricCard title="Risk alerts" value="3" change="1 high priority" direction="negative" note="sample alerts" icon={ShieldAlert} tone="red" />
        <MetricCard title="Reserve breach probability" value="18%" change="Illustrative only" direction="negative" note="sample scenario" icon={ChartNoAxesCombined} tone="amber" />
        <MetricCard title="Suggested deferrals" value="2" change="Requires review" direction="neutral" note="sample recommendations" icon={CalendarClock} tone="blue" />
      </section>
      <section className="content-grid risk-content-grid">
        <article className="panel">
          <SectionTitle title="Liquidity risk outlook" subtitle="Sample balances under an illustrative scenario" />
          <CashFlowChart forecast />
          <div className="risk-chart-foot"><span className="legend-dot amber-dot" /> Reserve threshold is illustrative, not a live risk calculation.</div>
        </article>
        <article className="panel">
          <SectionTitle title="Risk alerts" subtitle="Example risk register" />
          <div className="risk-list full-risk-list">
            {demoRisks.map((risk) => <div className="risk-row" key={risk.title}>
              <div className={`risk-indicator risk-${risk.level.toLowerCase()}`}><ShieldAlert size={17} /></div>
              <div className="risk-copy"><div><strong>{risk.title}</strong><span className={`risk-tag tag-${risk.level.toLowerCase()}`}>{risk.level}</span></div><p>{risk.detail}</p><small><CalendarClock size={13} /> {risk.date}</small></div>
            </div>)}
          </div>
        </article>
      </section>
      <article className="panel recommendations-panel">
        <SectionTitle title="Optimization recommendations" subtitle="Example actions that would require validation against live obligations and reserves." />
        <div className="recommendation-row"><div className="recommendation-number">01</div><div className="recommendation-copy"><strong>Review flexible vendor payment</strong><p>Check whether a non-urgent obligation can be rescheduled without fees or contract issues.</p></div><span className="recommendation-impact">Potential liquidity relief</span></div>
        <div className="recommendation-row"><div className="recommendation-number">02</div><div className="recommendation-copy"><strong>Confirm expected receivable date</strong><p>Verify the payment date before relying on the incoming funds to cover an obligation.</p></div><span className="recommendation-impact">Reduce uncertainty</span></div>
        <div className="recommendation-disclaimer">These are general example actions, not recommendations generated from your live company data.</div>
        <button className="button button-primary" onClick={() => setPage("forecast")}>Review forecast <ChevronRight size={16} /></button>
      </article>
    </>
  );
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const titles = {
    dashboard: "Dashboard",
    forecast: "Cash flow forecast",
    invoices: "Invoices & payments",
    risk: "Risk & simulation",
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
          {page === "dashboard" && <Dashboard setPage={setPage} />}
          {page === "forecast" && <Forecast setPage={setPage} />}
          {page === "invoices" && <Invoices />}
          {page === "risk" && <Risk setPage={setPage} />}
          <footer className="app-footer"><span>FlowPilot <span className="footer-separator">/</span> Financial intelligence for growing teams</span><span>Dark mode <span className="footer-dot" /></span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
