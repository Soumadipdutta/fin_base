import { useState } from "react";
import { Wallet, CircleDollarSign, ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import PageHeader from "../components/PageHeader";
import MetricCard from "../components/MetricCard";
import SectionTitle from "../components/SectionTitle";
import { useForecastData } from "../hooks/useForecastData";

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
        loading={loading}
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

export default Forecast;
