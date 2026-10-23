
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Download, 
} from "lucide-react";
import { getOptimizationHistory } from "../lib/companyApi";
import {
  exportOptimizationHistory,
  exportRunRecommendations,
} from "../lib/optimizationCsv";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

function formatMoney(value, currency = "") {
  if (value == null) return "—";

  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);

  return `${currency ? `${currency} ` : ""}${amount.toLocaleString(
    undefined,
    { maximumFractionDigits: 2 }
  )}`;
}

export default function OptimizationHistory() {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 10;

  async function loadHistory(nextOffset = offset) {
    setLoading(true);
    setError("");

    try {
      const response = await getOptimizationHistory({
        limit,
        offset: nextOffset,
      });

      setHistory(response.data.items ?? []);
      setTotal(response.data.total ?? 0);
      setOffset(nextOffset);
    } catch (err) {
      setError(
        err.response?.data?.detail ??
          "Could not load optimization history."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory(0);
    // Load the first page when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            FINANCIAL INTELLIGENCE
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Optimization History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review previously generated payment optimization results.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadHistory(offset)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
        <button
  type="button"
  onClick={() => {
    try {
      exportOptimizationHistory(history);
    } catch (err) {
      setError(err.message);
    }
  }}
  disabled={loading || history.length === 0}
  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
>
  <Download size={16} />
  Export CSV
</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total saved runs</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {total}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Runs on this page</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {history.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Unsafe schedules on this page</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">
            {history.filter((run) => !run.is_safe).length}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => loadHistory(offset)}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Loading optimization history…
        </div>
      ) : !error && history.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Clock className="mx-auto text-slate-400" size={32} />
          <h2 className="mt-3 font-semibold text-slate-800">
            No optimization runs yet
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Generate an optimization from the Financial Optimization page
            to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((run) => {
            const isExpanded = expandedId === run.id;
            const result = run.result ?? {};
            const recommendations = result.recommendations ?? [];
            const validation = result.schedule_validation ?? {};

            return (
              <article
                key={run.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        Run #{run.id}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {run.horizon_days}-day horizon
                      </span>

                      {run.is_safe ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <ShieldCheck size={14} />
                          Schedule safe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                          <ShieldAlert size={14} />
                          Breaches detected
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {formatDate(run.created_at)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        Recommendations
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {run.recommendation_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        Reserve breaches
                      </p>
                      <p
                        className={`mt-1 text-lg font-semibold ${
                          run.breach_count > 0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {run.breach_count}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : run.id)
                        }
                        className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        {isExpanded ? "Hide details" : "View details"}
                        {isExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-5 border-t border-slate-200 bg-slate-50 p-5">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Reserve validation
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        {validation.is_safe ? (
                          <CheckCircle2
                            size={17}
                            className="text-emerald-600"
                          />
                        ) : (
                          <AlertTriangle
                            size={17}
                            className="text-rose-600"
                          />
                        )}
                        <span className="text-slate-700">
                          {validation.is_safe
                            ? "No schedule breaches reported."
                            : `${validation.breach_count ?? run.breach_count} breach(es) reported.`}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Recommendations
                      </h3>
                      <button
    type="button"
    onClick={() => {
      try {
        exportRunRecommendations(run);
      } catch (err) {
        setError(err.message);
      }
    }}
    disabled={recommendations.length === 0}
    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
  >
    <Download size={15} />
    Export recommendations
  </button>

                      {recommendations.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          No recommendations were recorded for this run.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {recommendations.map((item, index) => (
                            <div
                              key={`${item.obligation_id ?? "item"}-${index}`}
                              className="rounded-lg border border-slate-200 bg-white p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-medium text-slate-800">
                                  Obligation #{item.obligation_id ?? "—"}
                                </p>
                                <p className="font-semibold text-slate-900">
                                  {formatMoney(item.amount, item.currency)}
                                </p>
                              </div>
                              <div className="mt-2 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                                <p>
                                  Original due date:{" "}
                                  {item.original_due_date ?? "—"}
                                </p>
                                <p>
                                  Recommended date:{" "}
                                  {item.recommended_date ?? "—"}
                                </p>
                                <p>Priority: {item.priority ?? "—"}</p>
                              </div>
                              {item.reason && (
                                <p className="mt-2 text-sm text-slate-700">
                                  {item.reason}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {Array.isArray(validation.breaches) &&
                      validation.breaches.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-rose-700">
                            Schedule breaches
                          </h3>
                          <div className="mt-3 space-y-2">
                            {validation.breaches.map((breach, index) => (
                              <div
                                key={`${breach.date ?? "date"}-${index}`}
                                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm"
                              >
                                <p className="font-medium text-rose-800">
                                  {breach.currency} · {breach.date}
                                </p>
                                <p className="mt-1 text-rose-700">
                                  Shortfall:{" "}
                                  {formatMoney(
                                    breach.shortfall,
                                    breach.currency
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {Array.isArray(result.limitations) &&
                      result.limitations.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            Limitations
                          </h3>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                            {result.limitations.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    <p className="text-xs text-slate-500">
                      Historical record only. This optimization run does not
                      execute or modify payments.
                    </p>
                  </div>
                )}
              </article>
            );
          })}

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing {total === 0 ? 0 : offset + 1}–
              {Math.min(offset + history.length, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading || offset === 0}
                onClick={() => loadHistory(Math.max(0, offset - limit))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={loading || offset + limit >= total}
                onClick={() => loadHistory(offset + limit)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
