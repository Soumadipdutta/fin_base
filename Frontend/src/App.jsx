import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Forecast from "./pages/Forecast";
import Invoices from "./pages/Invoices";
import Risk from "./pages/Risk";
import Copilot from "./pages/Copilot.jsx";
import MemoryManager from "./pages/MemoryManager";
import ScenarioPlanner from "./components/ScenarioPlanner";
import { testCompanyApi } from "./lib/testApi";
import { useDashboardData } from "./hooks/useDashboardData";
import "./App.css";

function App() {
  const [page, setPage] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    scenarios: "What-if planner",
    memory: "Copilot memory",
  };

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        open={mobileNavOpen}
        close={() => setMobileNavOpen(false)}
        companyName={dashboardData.company?.name}
        riskStatus={dashboardData.risks?.overall_status}
        riskCount={dashboardData.risks?.risk_count}
      />
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
          {page === "forecast" && (
            <Forecast
              baseCurrency={dashboardData.company?.base_currency}
              minimumReserve={dashboardData.company?.minimum_reserve}
            />
          )}
          {page === "invoices" && <Invoices />}
          {page === "risk" && <Risk baseCurrency={dashboardData.company?.base_currency} />}
          {page === "copilot" && <Copilot />}
          {page === "scenarios" && (
            <ScenarioPlanner
              baseCurrency={dashboardData.company?.base_currency}
              minimumReserve={dashboardData.company?.minimum_reserve}
            />
          )}
          {page === "memory" && <MemoryManager />}
          <footer className="app-footer"><span>FlowPilot <span className="footer-separator">/</span> Financial intelligence for growing teams</span><span>Balances stay in their original currencies</span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
