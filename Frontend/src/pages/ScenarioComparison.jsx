
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  GitCompareArrows,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getSavedScenarios,
  compareScenarios,
} from "../lib/companyApi";

const panelStyle = {
  background: "#111c30",
  border: "1px solid #24334a",
  borderRadius: 16,
  padding: 20,
};

function money(value, currency) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  } catch {
    return `${currency} ${Number(value ?? 0).toFixed(2)}`;
  }
}

function Metric({ label, value, color }) {
  return (
    <div
      style={{
        background: "#0b1424",
        border: "1px solid #24334a",
        borderRadius: 10,
        padding: 14,
        minWidth: 0,
      }}
    >
      <p style={{ color: "#91a4c3", fontSize: 12 }}>{label}</p>
      <strong
        style={{
          display: "block",
          color: color || "#edf3ff",
          fontSize: 18,
          marginTop: 8,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

export default function ScenarioComparison() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState("");

  async function loadScenarios() {
    setLoadingList(true);
    setError("");

    try {
      const data = await getSavedScenarios();
      const list = Array.isArray(data) ? data : [];

      setScenarios(list);
      setSelectedIds((current) =>
        current.filter((id) =>
          list.some((scenario) => String(scenario.id) === String(id))
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to load saved scenarios."
      );
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadScenarios();
  }, []);

  function toggleScenario(id) {
    setSelectedIds((current) => {
      const exists = current.some((item) => String(item) === String(id));

      if (exists) {
        return current.filter((item) => String(item) !== String(id));
      }

      if (current.length >= 3) {
        setError("Select no more than three scenarios.");
        return current;
      }

      setError("");
      return [...current, id];
    });
  }

  async function runComparison() {
    if (selectedIds.length < 2) {
      setError("Select at least two saved scenarios to compare.");
      return;
    }

    setComparing(true);
    setError("");
    setComparisons([]);

    try {
      const results = await compareScenarios(selectedIds);
      setComparisons(results);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to compare scenarios."
      );
    } finally {
      setComparing(false);
    }
  }

  const currencies = [
    ...new Set(
      comparisons.flatMap(({ preview }) =>
        (preview.currency_summaries || []).map(
          (summary) => summary.currency
        )
      )
    ),
  ];

  function summaryFor(preview, currency) {
    return (preview.currency_summaries || []).find(
      (item) => item.currency === currency
    );
  }

  function buildChartData(currency) {
    const rowsByDate = new Map();

    comparisons.forEach(({ scenario, preview }) => {
      (preview.daily_forecast || [])
        .filter((day) => day.currency === currency)
        .forEach((day) => {
          if (!rowsByDate.has(day.date)) {
            rowsByDate.set(day.date, { date: day.date });
          }

          rowsByDate.get(day.date)[scenario.name] =
            Number(day.closing_balance ?? 0);
        });
    });

    return [...rowsByDate.values()].sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
  }

  const lineColors = ["#6790ff", "#27c997", "#f07178"];

  return (
    <div style={{ color: "#edf3ff", padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <p
          style={{
            color: "#6790ff",
            fontSize: 12,
            letterSpacing: 2,
          }}
        >
          CASH FLOW INTELLIGENCE
        </p>

        <h1 style={{ fontSize: 30, fontWeight: 700 }}>
          Scenario Comparison
        </h1>

        <p style={{ color: "#91a4c3", marginTop: 8 }}>
          Compare saved assumptions to understand their projected
          impact on cash balances and liquidity risk.
        </p>
      </header>

      <section style={panelStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            Choose scenarios
          </h2>

          <button
            type="button"
            onClick={loadScenarios}
            disabled={loadingList}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #24334a",
              background: "transparent",
              color: "#edf3ff",
              cursor: loadingList ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={15} />
            Refresh list
          </button>
        </div>

        <p style={{ color: "#91a4c3", marginTop: 8 }}>
          Select two or three scenarios. Their forecasts will be
          recalculated using the saved assumptions and current data.
        </p>

        {loadingList ? (
          <p style={{ color: "#91a4c3", marginTop: 16 }}>
            Loading saved scenarios...
          </p>
        ) : scenarios.length === 0 ? (
          <div style={{ color: "#91a4c3", marginTop: 16 }}>
            No saved scenarios found. Create some in the What-if Planner first.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            {scenarios.map((scenario) => {
              const selected = selectedIds.some(
                (id) => String(id) === String(scenario.id)
              );

              return (
                <label
                  key={scenario.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: 14,
                    borderRadius: 10,
                    border: selected
                      ? "1px solid #6790ff"
                      : "1px solid #24334a",
                    background: selected ? "#172641" : "#0b1424",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleScenario(scenario.id)}
                    style={{ marginTop: 4, accentColor: "#6790ff" }}
                  />

                  <span>
                    <strong>{scenario.name}</strong>
                    <span
                      style={{
                        display: "block",
                        color: "#91a4c3",
                        fontSize: 12,
                        marginTop: 6,
                        lineHeight: 1.7,
                      }}
                    >
                      {scenario.days} days
                      <br />
                      Payment delay: {scenario.payment_delay_days} days
                      <br />
                      Revenue reduction: {scenario.revenue_reduction_pct}%
                      <br />
                      Expense increase: {scenario.expense_increase_pct}%
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 20,
          }}
        >
          <button
            type="button"
            onClick={runComparison}
            disabled={comparing || loadingList || selectedIds.length < 2}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              borderRadius: 9,
              border: 0,
              background: "#6790ff",
              color: "#081326",
              fontWeight: 700,
              cursor: "pointer",
              opacity:
                comparing || loadingList || selectedIds.length < 2
                  ? 0.55
                  : 1,
            }}
          >
            {comparing ? (
              <LoaderCircle size={16} />
            ) : (
              <GitCompareArrows size={16} />
            )}
            {comparing ? "Comparing..." : "Compare scenarios"}
          </button>

          <span style={{ color: "#91a4c3", fontSize: 13 }}>
            {selectedIds.length} of 3 selected
          </span>
        </div>

        {error && (
          <p role="alert" style={{ color: "#f07178", marginTop: 14 }}>
            {error}
          </p>
        )}
      </section>

      {comparisons.length > 0 && (
        <>
          <section style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 20, marginBottom: 14 }}>
              Comparison results
            </h2>

            {currencies.length === 0 && (
              <p style={{ color: "#91a4c3" }}>
                No currency summaries were returned. Check the scenario
                preview response before interpreting results.
              </p>
            )}

            {currencies.map((currency) => {
              const metrics = comparisons
                .map(({ scenario, preview }) => ({
                  scenario,
                  summary: summaryFor(preview, currency),
                }))
                .filter((item) => item.summary);

              const lowestEndingBalance = metrics.length
                ? Math.min(
                    ...metrics.map((item) =>
                      Number(item.summary.scenario_ending_balance)
                    )
                  )
                : null;

              return (
                <div key={currency} style={{ ...panelStyle, marginTop: 14 }}>
                  <h3 style={{ fontSize: 17, marginBottom: 14 }}>
                    Currency: {currency}
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {metrics.map(({ scenario, summary }) => {
                      const ending =
                        Number(summary.scenario_ending_balance ?? 0);

                      return (
                        <article
                          key={`${scenario.id}-${currency}`}
                          style={{
                            background: "#0b1424",
                            border: "1px solid #24334a",
                            borderRadius: 12,
                            padding: 16,
                          }}
                        >
                          <h4 style={{ marginBottom: 14 }}>
                            {scenario.name}
                          </h4>

                          <div style={{ display: "grid", gap: 10 }}>
                            <Metric
                              label="Baseline ending balance"
                              value={money(
                                summary.baseline_ending_balance,
                                currency
                              )}
                            />
                            <Metric
                              label="Scenario ending balance"
                              value={money(ending, currency)}
                              color={ending < 0 ? "#f07178" : "#27c997"}
                            />
                            <Metric
                              label="Change from baseline"
                              value={money(
                                summary.ending_balance_delta,
                                currency
                              )}
                              color={
                                Number(summary.ending_balance_delta) < 0
                                  ? "#f07178"
                                  : "#27c997"
                              }
                            />
                            <Metric
                              label="Negative-balance days"
                              value={summary.scenario_negative_days ?? "—"}
                              color={
                                Number(summary.scenario_negative_days) > 0
                                  ? "#f07178"
                                  : "#27c997"
                              }
                            />
                            <Metric
                              label="Reserve-breach days"
                              value={summary.reserve_breach_days ?? "—"}
                            />
                          </div>

                          {ending === lowestEndingBalance && (
                            <p
                              style={{
                                color: "#f07178",
                                fontSize: 12,
                                marginTop: 12,
                              }}
                            >
                              Lowest ending balance in this currency
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>

          {currencies.map((currency) => {
            const data = buildChartData(currency);
            const names = comparisons.map(({ scenario }) => scenario.name);

            return (
              <section
                key={currency}
                style={{ ...panelStyle, marginTop: 20 }}
              >
                <h2 style={{ fontSize: 18, marginBottom: 8 }}>
                  Closing balance comparison · {currency}
                </h2>

                <p style={{ color: "#91a4c3", marginBottom: 20 }}>
                  Each line represents a saved scenario. Different currencies
                  are charted separately.
                </p>

                {data.length ? (
                  <div style={{ width: "100%", height: 330 }}>
                    <ResponsiveContainer>
                      <LineChart data={data}>
                        <CartesianGrid
                          stroke="#24334a"
                          strokeDasharray="3 3"
                        />
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
                          formatter={(value, name) => [
                            money(value, currency),
                            name,
                          ]}
                        />
                        <Legend />
                        {names.map((name, index) => (
                          <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            name={name}
                            stroke={lineColors[index % lineColors.length]}
                            strokeWidth={2}
                            dot={false}
                            connectNulls={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: "#91a4c3" }}>
                    No daily forecast data was returned for {currency}.
                  </p>
                )}
              </section>
            );
          })}

          <p style={{ color: "#91a4c3", fontSize: 12, marginTop: 14 }}>
            These results are recalculated forecasts, not guarantees. They use
            current company data with the saved assumptions; they are not
            historical snapshots of the forecasts when scenarios were saved.
          </p>
        </>
      )}

      {!comparisons.length && !comparing && (
        <div
          style={{
            ...panelStyle,
            marginTop: 20,
            textAlign: "center",
            padding: 36,
          }}
        >
          <AlertTriangle
            size={28}
            style={{ color: "#e7ad55", margin: "0 auto 12px" }}
          />
          <p style={{ color: "#91a4c3" }}>
            Select at least two saved scenarios to see their differences.
          </p>
        </div>
      )}
    </div>
  );
}
