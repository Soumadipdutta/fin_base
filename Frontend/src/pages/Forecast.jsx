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
import { formatCompact, formatDate } from "../lib/financeFormatters";

function Forecast({ baseCurrency = "INR", minimumReserve }) {
  const {
    days,
    setDays,
    forecast,
    loading,
    error,
    refresh,
  } = useForecastData(30);

  // null until the user picks one, so the default can follow the data.
  const [selectedCurrency, setCurrency] = useState(null);

  const currencies = [
    ...new Set(
      (forecast?.daily_forecast || []).map((item) => item.currency)
    ),
  ];

  const currency = currencies.includes(selectedCurrency)
    ? selectedCurrency
    : currencies.includes(baseCurrency) || !currencies.length
      ? baseCurrency
      : currencies[0];

  const rows = (forecast?.daily_forecast || []).filter(
    (item) => item.currency === currency
  );

  // The reserve only applies to the company's base currency.
  const reserve = currency === baseCurrency ? Number(minimumReserve || 0) : 0;
  const shortfallDays = rows.filter((row) => Number(row.reserve_shortfall) > 0).length;

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
            aria-label="Forecast currency"
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
          subtitle={
            reserve > 0
              ? `Daily values in ${currency}. ${shortfallDays} of ${rows.length} days end below the ${money(reserve)} reserve.`
              : `Daily forecast values in ${currency}. This is a projection, not a guarantee.`
          }
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
                  tick={{ fill: "#8998ae", fontSize: 12 }}
                  tickFormatter={(value) => formatDate(value, { withYear: false })}
                  minTickGap={28}
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
                  labelFormatter={(label) => formatDate(label)}
                />
                {reserve > 0 && (
                  <ReferenceLine
                    y={reserve}
                    stroke="#e7ad55"
                    strokeDasharray="5 5"
                    label={{ value: "Reserve", fill: "#e7ad55", fontSize: 12, position: "insideTopRight" }}
                  />
                )}
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

        {forecast?.assumptions?.length > 0 && (
          <div className="limitations limitations-neutral">
            <strong>Forecast assumptions</strong>
            <ul>
              {forecast.assumptions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
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
                <th className="numeric">Opening</th>
                <th className="numeric">Inflows</th>
                <th className="numeric">Outflows</th>
                <th className="numeric">Closing</th>
                <th className="numeric">Reserve shortfall</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.date}-${row.currency}`}
                  className={Number(row.reserve_shortfall) > 0 ? "row-flagged" : ""}
                >
                  <td>{formatDate(row.date)}</td>
                  <td className="numeric">{money(row.opening_balance)}</td>
                  <td className="numeric">{Number(row.expected_inflows) ? `+${money(row.expected_inflows)}` : "—"}</td>
                  <td className="numeric">{Number(row.expected_outflows) ? `−${money(row.expected_outflows)}` : "—"}</td>
                  <td className={`numeric ${Number(row.closing_balance) < 0 ? "negative-value" : ""}`}>
                    {money(row.closing_balance)}
                  </td>
                  <td className={`numeric ${Number(row.reserve_shortfall) > 0 ? "warning-value" : ""}`}>
                    {row.reserve_shortfall == null || Number(row.reserve_shortfall) === 0
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
