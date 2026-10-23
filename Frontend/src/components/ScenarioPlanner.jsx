import { useEffect, useState } from "react";
import {
  AlertTriangle,
  LoaderCircle,
  RotateCcw,
  Save,
  History,
  FolderOpen,
  Trash2,
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
  ReferenceLine,
} from "recharts";
import PageHeader from "./PageHeader";
import SectionTitle from "./SectionTitle";
import {
  previewScenario,
  saveScenario,
  getSavedScenarios,
  getSavedScenario,
  deleteSavedScenario,
} from "../lib/companyApi";
import { getErrorMessage } from "../lib/errors";
import {
  formatCompact,
  formatDate,
  formatMoney,
  formatSignedMoney,
} from "../lib/financeFormatters";

function Assumption({ label, value, unit, ...inputProps }) {
  return (
    <label className="assumption">
      <span className="assumption-label">
        {label}
        <strong>{value}{unit}</strong>
      </span>
      <input type="range" value={value} {...inputProps} />
    </label>
  );
}

export default function ScenarioPlanner({ baseCurrency = "INR", minimumReserve }) {
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
      setError(getErrorMessage(err, "Unable to calculate scenario."));
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
      setError(getErrorMessage(err, "Unable to load saved scenarios."));
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
      setError(getErrorMessage(err, "Unable to save scenario."));
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
      setError(getErrorMessage(err, "Unable to load scenario."));
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
      setError(getErrorMessage(err, "Unable to delete scenario."));
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

  const reserve = Number(minimumReserve || 0);

  return (
    <>
      <PageHeader
        title="What-if Planner"
        description="Explore how delayed payments, lower revenue, and higher expenses could affect your future cash position."
      />

      <section className="content-grid scenario-layout">
        <article className="panel">
          <SectionTitle
            title="Scenario assumptions"
            subtitle="Applied on top of your current forecast."
          />

          <Assumption
            label="Forecast horizon"
            value={days}
            unit=" days"
            min="7"
            max="90"
            step="1"
            onChange={(e) => setDays(Number(e.target.value))}
          />
          <Assumption
            label="Payment delay"
            value={delay}
            unit=" days"
            min="0"
            max="90"
            onChange={(e) => setDelay(Number(e.target.value))}
          />
          <Assumption
            label="Revenue reduction"
            value={revenueDrop}
            unit="%"
            min="0"
            max="100"
            onChange={(e) => setRevenueDrop(Number(e.target.value))}
          />
          <Assumption
            label="Expense increase"
            value={expenseIncrease}
            unit="%"
            min="0"
            max="500"
            step="5"
            onChange={(e) => setExpenseIncrease(Number(e.target.value))}
          />

          <div className="scenario-actions">
            <button
              className="button button-primary"
              onClick={runScenario}
              disabled={loading}
            >
              {loading && <LoaderCircle size={15} className="spin" />}
              {loading ? "Calculating…" : "Run scenario"}
            </button>
            <button
              className="button button-secondary"
              onClick={resetScenario}
              title="Reset assumptions"
              aria-label="Reset assumptions"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="form-notice" role="status">{notice}</p>}

          <div className="scenario-section">
            <h3>Save this scenario</h3>
            <div className="inline-form">
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g. Delayed payments - October"
                aria-label="Scenario name"
                maxLength={150}
              />
              <button
                className="button button-secondary"
                onClick={handleSaveScenario}
                disabled={saving}
              >
                {saving ? <LoaderCircle size={15} className="spin" /> : <Save size={15} />}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          <div className="scenario-section">
            <h3><History size={15} /> Saved scenarios</h3>

            {historyLoading ? (
              <p className="muted-text">Loading saved scenarios…</p>
            ) : savedScenarios.length === 0 ? (
              <p className="muted-text">No saved scenarios yet.</p>
            ) : (
              <select
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                aria-label="Saved scenarios"
                className="full-width"
              >
                <option value="">Choose a saved scenario…</option>
                {savedScenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name} — {scenario.days} days
                  </option>
                ))}
              </select>
            )}

            <div className="inline-form">
              <button
                className="button button-secondary grow"
                onClick={handleLoadScenario}
                disabled={!selectedScenarioId}
              >
                <FolderOpen size={15} />
                Load scenario
              </button>
              <button
                className="button button-danger"
                onClick={handleDeleteScenario}
                disabled={!selectedScenarioId}
              >
                <Trash2 size={15} />
                Delete
              </button>
              <button
                className="button button-secondary"
                onClick={loadScenarioHistory}
                disabled={historyLoading}
                title="Refresh saved scenarios"
                aria-label="Refresh saved scenarios"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </article>

        <article className="panel">
          <SectionTitle
            title="Scenario results"
            subtitle={
              result
                ? `${formatDate(result.forecast_start)} – ${formatDate(result.forecast_end)}, compared with your baseline forecast.`
                : "Run a scenario to compare it with your baseline forecast."
            }
          />

          {!result && (
            <div className="empty-state">
              <div>
                <AlertTriangle size={26} className="empty-icon" />
                <p>Adjust the assumptions and run a scenario to see the impact.</p>
              </div>
            </div>
          )}

          {result && summaries.length === 0 && (
            <div className="empty-state">
              This scenario returned no currency results.
            </div>
          )}

          {result && summaries.map((summary) => {
            const currency = summary.currency;
            const delta = Number(summary.ending_balance_delta);

            return (
              <div className="scenario-result" key={currency}>
                <h3>{currency}</h3>

                <div className="scenario-metrics">
                  <div className="scenario-metric">
                    <span>Baseline ending balance</span>
                    <strong>{formatMoney(summary.baseline_ending_balance, currency)}</strong>
                  </div>
                  <div className="scenario-metric">
                    <span>Scenario ending balance</span>
                    <strong className={Number(summary.scenario_ending_balance) < 0 ? "negative-value" : ""}>
                      {formatMoney(summary.scenario_ending_balance, currency)}
                    </strong>
                  </div>
                  <div className="scenario-metric">
                    <span>Balance change</span>
                    <strong className={delta < 0 ? "negative-value" : delta > 0 ? "positive-value" : ""}>
                      {formatSignedMoney(delta, currency)}
                    </strong>
                  </div>
                  <div className="scenario-metric">
                    <span>Lowest balance</span>
                    <strong className={Number(summary.scenario_minimum_balance) < 0 ? "negative-value" : ""}>
                      {formatMoney(summary.scenario_minimum_balance, currency)}
                    </strong>
                    <small>Baseline {formatMoney(summary.baseline_minimum_balance, currency)}</small>
                  </div>
                </div>

                <p className="scenario-days">
                  Days below zero: <b>{summary.negative_balance_days ?? "—"}</b>
                  {" · "}
                  Days below reserve: <b>{summary.reserve_breach_days ?? "—"}</b>
                </p>
              </div>
            );
          })}

          {result?.limitations?.length > 0 && (
            <div className="limitations">
              <strong>Scenario limitations</strong>
              <ul>
                {result.limitations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </section>

      {result && chartData.length > 0 && (
        <section className="panel scenario-chart-panel">
          <SectionTitle
            title="Baseline vs. scenario"
            subtitle="Daily closing balance for each currency."
          />

          {Array.from(new Set(chartData.map((d) => d.currency))).map(
            (currency) => {
              const currencyRows = chartData.filter(
                (d) => d.currency === currency
              );

              return (
                <div key={currency} className="scenario-chart">
                  <h3>{currency}</h3>
                  <div className="chart-wrap forecast-large-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={currencyRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#263449" strokeDasharray="4 5" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#8998ae", fontSize: 12 }}
                          tickFormatter={(value) => formatDate(value, { withYear: false })}
                          minTickGap={24}
                        />
                        <YAxis
                          tick={{ fill: "#8998ae", fontSize: 12 }}
                          tickFormatter={formatCompact}
                          width={56}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#111c30",
                            border: "1px solid #293850",
                            borderRadius: 12,
                            color: "#f0f5ff",
                          }}
                          labelFormatter={(value) => formatDate(value)}
                          formatter={(value, name) => [formatMoney(value, currency), name]}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, color: "#aab8cc", paddingTop: 8 }} />
                        {currency === baseCurrency && reserve > 0 && (
                          <ReferenceLine
                            y={reserve}
                            stroke="#8796aa"
                            strokeDasharray="5 5"
                            label={{ value: "Reserve", fill: "#8796aa", fontSize: 12, position: "insideTopRight" }}
                          />
                        )}
                        <Line type="monotone" dataKey="Baseline" stroke="#6790ff" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Scenario" stroke="#e7ad55" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }
          )}
        </section>
      )}
    </>
  );
}
