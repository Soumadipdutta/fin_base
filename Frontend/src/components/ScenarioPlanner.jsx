
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  LoaderCircle,
  RotateCcw,
  Save,
  History,
  FolderOpen,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  previewScenario,
  saveScenario,
  getSavedScenarios,
  getSavedScenario,
} from "../lib/companyApi";

const panelStyle = {
  background: "#111c30",
  border: "1px solid #24334a",
  borderRadius: 16,
  padding: 20,
};

const inputStyle = {
  width: "100%",
  marginTop: 8,
  accentColor: "#6790ff",
};

function Metric({ label, value, color }) {
  return (
    <div style={panelStyle}>
      <p style={{ color: "#91a4c3", fontSize: 13 }}>{label}</p>
      <h2 style={{ color: color || "#edf3ff", fontSize: 24 }}>
        {value}
      </h2>
    </div>
  );
}

function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export default function ScenarioPlanner() {
  const [days, setDays] = useState(30);
  const [delay, setDelay] = useState(7);
  const [revenueDrop, setRevenueDrop] = useState(20);
  const [expenseIncrease, setExpenseIncrease] = useState(10);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function runScenario() {
    setLoading(true);
    setError("");

    try {
      const data = await previewScenario({
        days,
        payment_delay_days: delay,
        revenue_reduction_pct: revenueDrop,
        expense_increase_pct: expenseIncrease,
      });
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to calculate scenario."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetScenario() {
    setDays(30);
    setDelay(7);
    setRevenueDrop(20);
    setExpenseIncrease(10);
    setResult(null);
    setError("");
  }

  
async function loadScenarioHistory() {
  setHistoryLoading(true);

  try {
    const data = await getSavedScenarios();
    setSavedScenarios(Array.isArray(data) ? data : []);
  } catch (err) {
    setError(
      err.response?.data?.detail ||
      err.message ||
      "Unable to load saved scenarios."
    );
  } finally {
    setHistoryLoading(false);
  }
}

useEffect(() => {
  loadScenarioHistory();
}, []);

async function handleSaveScenario() {
  if (!scenarioName.trim()) {
    setError("Enter a name for this scenario.");
    return;
  }

  setSaving(true);
  setError("");
  setNotice("");

  try {
    await saveScenario({
      name: scenarioName.trim(),
      days,
      payment_delay_days: delay,
      revenue_reduction_pct: revenueDrop,
      expense_increase_pct: expenseIncrease,
    });

    setNotice("Scenario saved successfully.");
    setScenarioName("");
    await loadScenarioHistory();
  } catch (err) {
    setError(
      err.response?.data?.detail ||
      err.message ||
      "Unable to save scenario."
    );
  } finally {
    setSaving(false);
  }
}

async function handleLoadScenario() {
  if (!selectedScenarioId) {
    setError("Select a saved scenario first.");
    return;
  }

  setError("");
  setNotice("");

  try {
    const scenario = await getSavedScenario(selectedScenarioId);

    setDays(scenario.days);
    setDelay(scenario.payment_delay_days);
    setRevenueDrop(Number(scenario.revenue_reduction_pct));
    setExpenseIncrease(Number(scenario.expense_increase_pct));

    // Recalculate results using the loaded assumptions.
    const data = await previewScenario({
      days: scenario.days,
      payment_delay_days: scenario.payment_delay_days,
      revenue_reduction_pct: Number(scenario.revenue_reduction_pct),
      expense_increase_pct: Number(scenario.expense_increase_pct),
    });

    setResult(data);
    setScenarioName(scenario.name);
    setNotice(`Loaded "${scenario.name}".`);
  } catch (err) {
    setError(
      err.response?.data?.detail ||
      err.message ||
      "Unable to load scenario."
    );
  }
}
async function handleDeleteScenario() {
  if (!selectedScenarioId) {
    setError("Select a saved scenario first.");
    return;
  }

  const selected = savedScenarios.find(
    (scenario) => String(scenario.id) === String(selectedScenarioId)
  );

  if (!selected) {
    setError("The selected scenario could not be found.");
    return;
  }

  if (!window.confirm(`Delete "${selected.name}" permanently?`)) {
    return;
  }

  setError("");
  setNotice("");

  try {
    await deleteSavedScenario(selectedScenarioId);

    setSavedScenarios((current) =>
      current.filter(
        (scenario) => String(scenario.id) !== String(selectedScenarioId)
      )
    );

    setSelectedScenarioId("");
    setNotice("Scenario deleted successfully.");
  } catch (err) {
    setError(
      err.response?.data?.detail ||
      err.message ||
      "Unable to delete scenario."
    );
  }
}

const summaries = Array.isArray(result?.currency_summaries)
  ? result.currency_summaries
  : [];

const chartData = (result?.daily_forecast || []).map((day) => ({
  date: day.date,
  Baseline: Number(day.baseline_closing_balance ?? 0),
  Scenario: Number(day.closing_balance ?? 0),
  currency: day.currency,
}));

  return (
    <div style={{ color: "#edf3ff", padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "#6790ff", fontSize: 12, letterSpacing: 2 }}>
          CASH FLOW INTELLIGENCE
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 700 }}>
          What-if Scenario Planner
        </h1>
        <p style={{ color: "#91a4c3", marginTop: 8 }}>
          Explore how delayed payments, lower revenue, and higher expenses
          could affect your future cash position.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        <section style={panelStyle}>
            
<div
  style={{
    marginTop: 24,
    paddingTop: 20,
    borderTop: "1px solid #24334a",
  }}
>
  <h3 style={{ fontSize: 16, fontWeight: 600 }}>
    Save this scenario
  </h3>

  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
    <input
      type="text"
      value={scenarioName}
      onChange={(e) => setScenarioName(e.target.value)}
      placeholder="e.g. Delayed payments - October"
      maxLength={150}
      style={{
        flex: 1,
        minWidth: 0,
        padding: 11,
        borderRadius: 8,
        border: "1px solid #24334a",
        background: "#0b1424",
        color: "#edf3ff",
      }}
    />

    <button
      onClick={handleSaveScenario}
      disabled={saving}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "10px 12px",
        borderRadius: 8,
        border: 0,
        background: "#27c997",
        color: "#081326",
        fontWeight: 700,
        cursor: saving ? "wait" : "pointer",
      }}
    >
      {saving ? (
        <LoaderCircle size={15} />
      ) : (
        <Save size={15} />
      )}
      {saving ? "Saving..." : "Save"}
    </button>
  </div>
</div>

<div
  style={{
    marginTop: 24,
    paddingTop: 20,
    borderTop: "1px solid #24334a",
  }}
>
  <h3
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    <History size={17} />
    Saved scenarios
  </h3>

  {historyLoading ? (
    <p style={{ color: "#91a4c3", marginTop: 12 }}>
      Loading saved scenarios...
    </p>
  ) : savedScenarios.length === 0 ? (
    <p style={{ color: "#91a4c3", marginTop: 12 }}>
      No saved scenarios yet.
    </p>
  ) : (
    <select
      value={selectedScenarioId}
      onChange={(e) => setSelectedScenarioId(e.target.value)}
      style={{
        width: "100%",
        marginTop: 12,
        padding: 11,
        borderRadius: 8,
        border: "1px solid #24334a",
        background: "#0b1424",
        color: "#edf3ff",
      }}
    >
      <option value="">Choose a saved scenario...</option>
      {savedScenarios.map((scenario) => (
        <option key={scenario.id} value={scenario.id}>
          {scenario.name} — {scenario.days} days
        </option>
      ))}
    </select>
  )}

  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
    <button
      onClick={handleLoadScenario}
      disabled={!selectedScenarioId}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 11,
        borderRadius: 8,
        border: "1px solid #24334a",
        background: "#172641",
        color: "#edf3ff",
        cursor: selectedScenarioId ? "pointer" : "not-allowed",
        opacity: selectedScenarioId ? 1 : 0.5,
      }}
    >
      <FolderOpen size={16} />
      Load scenario
    </button>
      <button
  onClick={handleDeleteScenario}
  disabled={!selectedScenarioId}
  style={{
    padding: 11,
    borderRadius: 8,
    border: "1px solid #703944",
    background: "#351c2a",
    color: "#f07178",
    cursor: selectedScenarioId ? "pointer" : "not-allowed",
    opacity: selectedScenarioId ? 1 : 0.5,
  }}
>
  Delete
</button>
    <button
      onClick={loadScenarioHistory}
      disabled={historyLoading}
      title="Refresh saved scenarios"
      style={{
        padding: 11,
        borderRadius: 8,
        border: "1px solid #24334a",
        background: "transparent",
        color: "#edf3ff",
        cursor: "pointer",
      }}
    >
      <RotateCcw size={16} />
    </button>
  </div>
</div>

{notice && (
  <p role="status" style={{ color: "#27c997", marginTop: 14 }}>
    {notice}
  </p>
)}

          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            Scenario assumptions
          </h2>

          <label style={{ display: "block", marginTop: 24 }}>
            Forecast horizon: <b>{days} days</b>
            <input
              style={inputStyle}
              type="range"
              min="7"
              max="90"
              step="1"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </label>

          <label style={{ display: "block", marginTop: 24 }}>
            Payment delay: <b>{delay} days</b>
            <input
              style={inputStyle}
              type="range"
              min="0"
              max="90"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            />
          </label>

          <label style={{ display: "block", marginTop: 24 }}>
            Revenue reduction: <b>{revenueDrop}%</b>
            <input
              style={inputStyle}
              type="range"
              min="0"
              max="100"
              value={revenueDrop}
              onChange={(e) => setRevenueDrop(Number(e.target.value))}
            />
          </label>

          <label style={{ display: "block", marginTop: 24 }}>
            Expense increase: <b>{expenseIncrease}%</b>
            <input
              style={inputStyle}
              type="range"
              min="0"
              max="500"
              step="5"
              value={expenseIncrease}
              onChange={(e) => setExpenseIncrease(Number(e.target.value))}
            />
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            <button
              onClick={runScenario}
              disabled={loading}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                border: 0,
                background: "#6790ff",
                color: "#081326",
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? (
                <LoaderCircle
                  size={16}
                  style={{
                    display: "inline",
                    verticalAlign: "middle",
                    marginRight: 8,
                  }}
                />
              ) : null}
              {loading ? "Calculating..." : "Run scenario"}
            </button>

            <button
              onClick={resetScenario}
              title="Reset assumptions"
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #24334a",
                background: "transparent",
                color: "#edf3ff",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {error && (
            <p role="alert" style={{ color: "#f07178", marginTop: 16 }}>
              {error}
            </p>
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            Scenario results
          </h2>

          {!result && (
            <div style={{ padding: "48px 8px", textAlign: "center" }}>
              <AlertTriangle
                size={30}
                style={{ color: "#e7ad55", margin: "0 auto 12px" }}
              />
              <p style={{ color: "#91a4c3" }}>
                Adjust the assumptions and run a scenario to see the impact.
              </p>
            </div>
          )}

          {result && summaries.length === 0 && (
            <p style={{ color: "#91a4c3", marginTop: 20 }}>
              The API returned a result, but no currency summary was found.
              Inspect the response shape before interpreting the results.
            </p>
          )}

          {result && summaries.map((summary) => {
            const currency = summary.currency;
            return (
            <div key={currency} style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 12 }}>{currency}</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 12,
                }}
              >
                <Metric
                  label="Baseline ending balance"
                  value={money(summary.baseline_ending_balance, currency)}
                />
                <Metric
                  label="Scenario ending balance"
                  value={money(summary.scenario_ending_balance, currency)}
                  color={
                    Number(summary.scenario_ending_balance) < 0
                      ? "#f07178"
                      : "#27c997"
                  }
                />
                <Metric
                  label="Balance change"
                  value={money(summary.ending_balance_delta, currency)}
                  color={
                    Number(summary.ending_balance_delta) < 0
                      ? "#f07178"
                      : "#27c997"
                  }
                />
              </div>

              <p style={{ color: "#91a4c3", marginTop: 14 }}>
                Negative-balance days:{" "}
                <b>{summary.scenario_negative_days ?? "—"}</b>
                {" · "}
                Reserve-breach days:{" "}
                <b>{summary.reserve_breach_days ?? "—"}</b>
              </p>
            </div>
          );
})}
        </section>
      </div>

      {result && chartData.length > 0 && (
        <section style={{ ...panelStyle, marginTop: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
            Baseline vs. scenario
          </h2>
          <p style={{ color: "#91a4c3", marginBottom: 16 }}>
            The chart shows the daily closing balance. If your forecast
            contains multiple currencies, filter to one currency before
            comparing lines.
          </p>

          {Array.from(new Set(chartData.map((d) => d.currency))).map(
            (currency) => {
              const currencyRows = chartData.filter(
                (d) => d.currency === currency
              );

              return (
                <div key={currency} style={{ marginTop: 24 }}>
                  <h3 style={{ marginBottom: 12 }}>{currency}</h3>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={currencyRows}>
                        <CartesianGrid stroke="#24334a" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          stroke="#91a4c3"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          stroke="#91a4c3"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) =>
                            new Intl.NumberFormat("en-US", {
                              notation: "compact",
                              maximumFractionDigits: 1,
                            }).format(value)
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#111c30",
                            border: "1px solid #24334a",
                            borderRadius: 10,
                          }}
                          formatter={(value) => money(value, currency)}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Baseline"
                          stroke="#6790ff"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="Scenario"
                          stroke="#f07178"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }
          )}
        </section>
      )}
    </div>
  );
}
