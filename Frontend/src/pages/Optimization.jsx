
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getOptimization } from "../lib/companyApi";

const formatMoney = (value, currency = "USD") => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;
  if (detail) return JSON.stringify(detail);

  return error?.message || "Unable to load optimization recommendations.";
};

function MetricCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-slate-500">
        <Icon size={18} />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

export default function Optimization() {
  const [days, setDays] = useState(30);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runOptimization() {
    setLoading(true);
    setError("");

    try {
      // The backend accepts `days` as a query parameter.
      const response = await getOptimization({ params: { days } });
      setResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const recommendations = result?.recommendations ?? [];
  const totals = result?.total_deferred_by_currency ?? {};
  const validation = result?.schedule_validation;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Financial Optimization
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Identify flexible obligations that may be postponed to protect
            available cash and minimum reserves.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Forecast horizon
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>

          <button
            onClick={runOptimization}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Analyzing..." : "Run optimization"}
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Optimization failed</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <TrendingUp size={32} className="mx-auto mb-3 text-slate-400" />
          <h2 className="font-semibold text-slate-800">
            Ready to analyze your payment schedule?
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Choose a forecast horizon and run optimization to retrieve
            recommendations from your backend.
          </p>
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Analyzing forecast and obligations...
        </div>
      )}

      {result && !loading && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              icon={Wallet}
              label="Minimum reserve"
              value={formatMoney(result.minimum_reserve)}
              description="Configured company reserve"
            />

            <MetricCard
              icon={Clock}
              label="Recommendations"
              value={recommendations.length}
              description="Suggested obligation postponements"
            />

            <MetricCard
              icon={validation?.is_safe ? ShieldCheck : ShieldAlert}
              label="Schedule validation"
              value={validation?.is_safe ? "Reserve protected" : "Breaches found"}
              description={
                validation
                  ? `${validation.breach_count} reserve breach(es) reported`
                  : "Validation unavailable"
              }
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Total deferred by currency
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Amounts are kept separate by currency; they are not combined
                into one total.
              </p>
            </div>

            {Object.keys(totals).length === 0 ? (
              <p className="text-sm text-slate-500">
                No deferred amounts were returned.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(totals).map(([currency, amount]) => (
                  <div
                    key={currency}
                    className="rounded-lg bg-slate-50 p-4"
                  >
                    <p className="text-sm text-slate-500">{currency}</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {formatMoney(amount, currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Recommended actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review each suggested date and its rationale before changing
                your payment schedule.
              </p>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={30} className="mx-auto mb-3 text-emerald-600" />
                <p className="font-medium text-slate-800">
                  No postponement recommendations
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  The optimizer returned no suggested changes for this horizon.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recommendations.map((item, index) => (
                  <article
                    key={`${item.obligation_id}-${item.currency}-${index}`}
                    className="p-5"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            Priority {item.priority}
                          </span>
                          <span className="text-xs text-slate-500">
                            Obligation #{item.obligation_id}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-semibold text-slate-900">
                          {formatMoney(item.amount, item.currency)}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.reason}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:min-w-64">
                        <div>
                          <p className="text-xs text-slate-500">Original due</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">
                            {formatDate(item.original_due_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            Recommended date
                          </p>
                          <p className="mt-1 text-sm font-medium text-emerald-700">
                            {formatDate(item.recommended_date)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {item.expected_benefit &&
                      Object.keys(item.expected_benefit).length > 0 && (
                        <div className="mt-4 rounded-lg bg-slate-50 p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Expected benefit details
                          </p>
                          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {Object.entries(item.expected_benefit).map(
                              ([key, value]) => (
                                <div key={key}>
                                  <dt className="text-xs text-slate-500">
                                    {key.replaceAll("_", " ")}
                                  </dt>
                                  <dd className="mt-1 break-words text-sm font-medium text-slate-800">
                                    {typeof value === "object" && value !== null
                                      ? JSON.stringify(value)
                                      : String(value ?? "—")}
                                  </dd>
                                </div>
                              )
                            )}
                          </dl>
                        </div>
                      )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {validation?.breaches?.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={21} className="mt-0.5 shrink-0 text-amber-700" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-amber-900">
                    Reserve breaches to review
                  </h2>
                  <p className="mt-1 text-sm text-amber-800">
                    The returned schedule contains dates where projected
                    balances fall below the applicable reserve.
                  </p>

                  <div className="mt-4 space-y-3">
                    {validation.breaches.map((breach, index) => (
                      <div
                        key={`${breach.currency}-${breach.date}-${index}`}
                        className="rounded-lg border border-amber-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap justify-between gap-2">
                          <span className="font-medium text-slate-800">
                            {breach.currency} · {formatDate(breach.date)}
                          </span>
                          <span className="font-semibold text-red-700">
                            Shortfall: {formatMoney(breach.shortfall, breach.currency)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          Projected closing balance:{" "}
                          {formatMoney(
                            breach.projected_closing_balance,
                            breach.currency
                          )}
                        </p>
                        <p className="text-sm text-slate-600">
                          Applicable reserve:{" "}
                          {formatMoney(
                            breach.applicable_reserve,
                            breach.currency
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {result.limitations?.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="mt-0.5 text-slate-500" />
                <h2 className="font-semibold text-slate-900">
                  Limitations and assumptions
                </h2>
              </div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                {result.limitations.map((limitation, index) => (
                  <li key={index}>{limitation}</li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs text-slate-500">
            Recommendations are advisory only. This page does not execute
            payments or modify obligations.
          </p>
        </>
      )}
    </div>
  );
}
