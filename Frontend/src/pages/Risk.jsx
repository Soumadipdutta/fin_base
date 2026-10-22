import { useState } from "react";
import { ShieldAlert, Bell, ChartNoAxesCombined } from "lucide-react";
import PageHeader from "../components/PageHeader";
import MetricCard from "../components/MetricCard";
import SectionTitle from "../components/SectionTitle";
import { useRiskData } from "../hooks/useRiskData";

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

export default Risk;
