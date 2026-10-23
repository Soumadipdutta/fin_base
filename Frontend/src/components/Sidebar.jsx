import {
  LayoutDashboard,
  ChartNoAxesCombined,
  ReceiptText,
  ShieldAlert,
  ArrowUpRight,
  CircleDollarSign,
  ChevronRight,
  CircleHelp,
  Bot,
  SlidersHorizontal,
  Brain,
  X,
} from "lucide-react";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "forecast", label: "Cash Flow Forecast", icon: ChartNoAxesCombined },
  { id: "invoices", label: "Invoices & Payments", icon: ReceiptText },
  { id: "risk", label: "Risk & Simulation", icon: ShieldAlert },
  { id: "copilot", label: "AI Copilot", icon: Bot },
  { id: "scenarios", label: "What-if Planner", icon: SlidersHorizontal },
  { id: "memory", label: "Memory", icon: Brain },
];

function Sidebar({ page, setPage, open, close, companyName, riskStatus, riskCount }) {
  // Each risk record is one forecast day below zero or below the reserve.
  const flaggedDays = Number(riskCount || 0);
  const showRiskCount = flaggedDays > 0 && (riskStatus === "warning" || riskStatus === "critical");

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
            <strong>{companyName || "Startup workspace"}</strong>
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
              {id === "risk" && showRiskCount && (
                <span
                  className={`nav-count ${riskStatus === "critical" ? "nav-count-critical" : ""}`}
                  title={`${flaggedDays} forecast ${flaggedDays === 1 ? "day" : "days"} flagged`}
                >
                  {flaggedDays}
                </span>
              )}
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

export default Sidebar;
