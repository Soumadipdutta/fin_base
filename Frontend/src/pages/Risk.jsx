import { useState } from "react";
import { ShieldAlert, Bell, ChartNoAxesCombined, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import PageHeader from "../components/PageHeader";
import MetricCard from "../components/MetricCard";
import SectionTitle from "../components/SectionTitle";
import { useRiskData } from "../hooks/useRiskData";
import { formatDate, formatMoney, RISK_TONE } from "../lib/financeFormatters";

const probability = (value) =>
  value == null ? "—" : `${(Number(value) * 100).toFixed(1)}%`;

function Risk({ baseCurrency = "INR" }) {
  const {
    risks,
    simulation,
    optimization,
    obligations,
    loading,
    simulationLoading,
    optimizationLoading,
    error,
    refreshRisks,
    runSimulation,
    loadOptimization,
  } = useRiskData();

  // null until the user picks one, so the default can follow the data.
  const [selectedCurrency, setCurrency] = useState(null);

  const results = simulation?.results || [];
  const currencies = [
    ...new Set([
      baseCurrency,
      ...results.map((item) => item.currency),
      ...(risks?.risks || []).map((item) => item.currency),
    ].filter(Boolean)),
  ];
  const currency = currencies.includes(selectedCurrency) ? selectedCurrency : baseCurrency;
  const currencyResults = results.filter((item) => !item.currency || item.currency === currency);
  const dailyRisk = (currencyResults[0]?.daily_risk || []).map((day) => ({
    date: day.date,
    zero: Number(day.probability_below_zero || 0),
    reserve: day.probability_below_reserve == null ? null : Number(day.probability_below_reserve),
  }));

  const overallStatus = String(risks?.overall_status || "unknown").toLowerCase();
  const dailyRisks = risks?.risks || [];
  const validation = optimization?.schedule_validation;
  const obligationNames = Object.fromEntries(
    (obligations || []).map((item) => [item.id, item.category])
  );

  return (
    <>
      <PageHeader
        title="Risk & Simulation"
        description="Inspect liquidity warnings, run cash-flow scenarios, and review optimization output."
        onRefresh={refreshRisks}
        loading={loading}
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
          value={overallStatus === "unknown" ? "Unknown" : overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
          note="Next 30 days of the forecast"
          icon={ShieldAlert}
          tone={RISK_TONE[overallStatus] || "purple"}
        />
        <MetricCard
          title="Flagged forecast days"
          value={risks?.risk_count ?? "—"}
          note="Below zero or below the reserve"
          icon={Bell}
          tone="amber"
        />
        <MetricCard
          title="Monte Carlo runs"
          value={results[0]?.simulations != null ? Number(results[0].simulations).toLocaleString("en-IN") : "—"}
          note={
            results[0]
              ? `Receipts delayed up to ${results[0].max_delay_days} days`
              : "Run a simulation below"
          }
          icon={ChartNoAxesCombined}
          tone="blue"
        />
        <MetricCard
          title="Schedule validation"
          value={
            validation?.is_safe == null
              ? "Not checked"
              : validation.is_safe
                ? "Safe"
                : `${validation.breach_count} ${validation.breach_count === 1 ? "breach" : "breaches"}`
          }
          note="After recommended payment changes"
          icon={ShieldAlert}
          tone={validation?.is_safe == null ? "blue" : validation.is_safe ? "green" : "red"}
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
                {currencies.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </label>

            <button
              className="button button-primary"
              onClick={runSimulation}
              disabled={simulationLoading}
            >
              {simulationLoading ? "Running…" : simulation ? "Run again" : "Run simulation"}
            </button>
          </div>

          {currencyResults.length > 0 ? (
            <div className="scenario-grid">
              {currencyResults.map((result, index) => (
                <div className="scenario-card" key={result.currency || index}>
                  <span className="field-label">
                    {result.currency || currency} · {Number(result.simulations).toLocaleString("en-IN")} runs
                  </span>
                  <strong>
                    {probability(result.probability_ever_below_zero)}
                  </strong>
                  <p>Chance cash goes below zero at least once</p>
                  <div className="scenario-divider" />
                  <span className="field-label">Reserve breach probability</span>
                  <strong>
                    {probability(result.probability_ever_below_reserve)}
                  </strong>
                  <p>
                    {result.probability_ever_below_reserve == null
                      ? "Reserve is only tracked in the base currency"
                      : "Chance of falling below the minimum reserve"}
                  </p>
                  <div className="scenario-divider" />
                  <span className="field-label">Worst observed shortfall</span>
                  <strong>
                    {result.worst_shortfall_observed == null
                      ? "—"
                      : formatMoney(result.worst_shortfall_observed, result.currency || currency)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {simulationLoading
                ? "Running simulation…"
                : simulation
                  ? `No simulation results for ${currency}.`
                  : "Run the simulation to see how likely a cash shortfall is."}
            </div>
          )}

          {dailyRisk.length > 0 && (
            <div className="probability-chart">
              <div className="chart-legend-note">
                {dailyRisk.some((day) => day.reserve != null) && (
                  <><span className="legend-dot amber-dot" /> Below reserve</>
                )}
                <span className="legend-dot red-dot" /> Below zero
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyRisk} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#263449" strokeDasharray="4 5" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#8998ae", fontSize: 12 }}
                      tickFormatter={(value) => formatDate(value, { withYear: false })}
                      minTickGap={24}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tick={{ fill: "#8998ae", fontSize: 12 }}
                      tickFormatter={(value) => `${Math.round(value * 100)}%`}
                      width={44}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111c30",
                        border: "1px solid #293850",
                        borderRadius: 12,
                        color: "#f0f5ff",
                      }}
                      labelFormatter={(value) => formatDate(value)}
                      formatter={(value, name) => [
                        probability(value),
                        name === "reserve" ? "Below reserve" : "Below zero",
                      ]}
                    />
                    {dailyRisk.some((day) => day.reserve != null) && (
                      <Area type="stepAfter" dataKey="reserve" stroke="#e7ad55" fill="#e7ad55" fillOpacity={0.12} />
                    )}
                    <Area type="stepAfter" dataKey="zero" stroke="#ef7b82" fill="#ef7b82" fillOpacity={0.12} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-caption">
                Share of simulated runs that end each day below the line.
              </p>
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
            subtitle="Payments that can move within their flexible window to protect your reserve."
          />

          <button
            className="button button-secondary"
            onClick={loadOptimization}
            disabled={optimizationLoading}
          >
            {optimizationLoading ? "Checking…" : optimization ? "Check again" : "Check payment schedule"}
          </button>

          {optimization && (
            <>
              <div className="optimization-status">
                <span>Schedule after these changes</span>
                <strong className={validation?.is_safe ? "" : "negative-value"}>
                  {validation?.is_safe
                    ? "No reserve breaches"
                    : `${validation?.breach_count ?? 0} ${validation?.breach_count === 1 ? "day" : "days"} below reserve`}
                </strong>
              </div>

              {(optimization.recommendations || []).length ? (
                <div className="recommendation-list">
                  {optimization.recommendations.map((item, index) => {
                    const name = obligationNames[item.obligation_id];
                    const benefit = item.expected_benefit || {};

                    return (
                      <div className="recommendation-row" key={item.obligation_id ?? index}>
                        <div className="recommendation-head">
                          <strong className="capitalize">
                            Defer {name || `obligation #${item.obligation_id}`}
                          </strong>
                          <span className="recommendation-amount">
                            {formatMoney(item.amount, item.currency)}
                          </span>
                        </div>
                        <div className="recommendation-dates">
                          {formatDate(item.original_due_date)}
                          <ArrowRight size={13} />
                          {formatDate(item.recommended_date)}
                        </div>
                        <p>
                          {Number(benefit.original_reserve_shortfall) > 0 &&
                            `Paying on the due date leaves you ${formatMoney(benefit.original_reserve_shortfall, item.currency)} below your reserve. `}
                          {benefit.projected_reserve_headroom_on_recommended_date != null &&
                            `On the new date you stay ${formatMoney(benefit.projected_reserve_headroom_on_recommended_date, item.currency)} above it.`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  No payment changes recommended. Only obligations with a flexible
                  date can be moved, and the schedule above may still breach your reserve.
                </div>
              )}

              {Object.keys(optimization.total_deferred_by_currency || {}).length > 0 && (
                <p className="recommendation-total">
                  Total deferred:{" "}
                  {Object.entries(optimization.total_deferred_by_currency)
                    .map(([code, amount]) => formatMoney(amount, code))
                    .join(" · ")}
                </p>
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
          title="Flagged days"
          subtitle="Each day the forecast ends below zero or below your minimum reserve."
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
                  <th className="numeric">Closing balance</th>
                  <th className="numeric">Reserve shortfall</th>
                </tr>
              </thead>
              <tbody>
                {dailyRisks.map((item, index) => (
                  <tr key={`${item.date}-${item.currency}-${index}`}>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.currency || "—"}</td>
                    <td>
                      <span className={`status-pill ${item.severity === "critical" ? "status-red" : ""}`}>
                        {item.severity || "Unspecified"}
                      </span>
                    </td>
                    <td className={`numeric ${Number(item.closing_balance) < 0 ? "negative-value" : ""}`}>
                      {item.closing_balance == null
                        ? "—"
                        : formatMoney(item.closing_balance, item.currency || currency)}
                    </td>
                    <td className="numeric warning-value">
                      {item.reserve_shortfall == null || Number(item.reserve_shortfall) === 0
                        ? "—"
                        : formatMoney(item.reserve_shortfall, item.currency || currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            {overallStatus === "healthy"
              ? "No flagged days. Projected cash stays above zero and your reserve."
              : "No flagged days were returned for this forecast."}
          </div>
        )}
      </section>
    </>
  );
}

export default Risk;
