import { RefreshCw } from "lucide-react";
import { useApiStatus } from "../hooks/useApiStatus";

function PageHeader({ title, description, onRefresh, loading = false }) {
  const { status: apiStatus, checkStatus } = useApiStatus();
  return (
    <header className="page-header">
      <div className="header-title">
        <span className="eyebrow">FINANCIAL OVERVIEW</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      
      <div className={`api-status api-status-${apiStatus}`} role="status" aria-live="polite">
        <span className="api-status-dot" />
        <span>
          {apiStatus === "connected"
            ? "API connected"
            : apiStatus === "checking"
              ? "Checking API…"
              : "API disconnected"}
        </span>
        <button
          type="button"
          onClick={checkStatus}
          className="api-status-refresh"
          title="Check API connection"
          aria-label="Check API connection"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {onRefresh && (
        <div className="header-actions">
          <button className="button button-secondary" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            {loading ? "Refreshing…" : "Refresh data"}
          </button>
        </div>
      )}
    </header>
  );
}

export default PageHeader;
