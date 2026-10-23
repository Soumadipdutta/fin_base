export function formatMoney(value, currency = "INR") {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function getArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.accounts)) return response.accounts;
  if (Array.isArray(response?.invoices)) return response.invoices;
  if (Array.isArray(response?.obligations)) return response.obligations;
  return [];
}

export function getInvoiceLabel(invoice) {
  return invoice.invoice_number || invoice.reference || `INV-${invoice.id}`;
}

export function getInvoiceDate(invoice) {
  return invoice.expected_date || invoice.due_date || invoice.issue_date || "No date";
}

export function formatSignedMoney(value, currency = "INR") {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount === 0) return formatMoney(0, currency);
  // A real minus sign keeps the sign readable next to coloured text.
  return `${amount > 0 ? "+" : "−"}${formatMoney(Math.abs(amount), currency)}`;
}

// Short axis labels: 6.2L, 1.2Cr, 8.4K.
export function formatCompact(value) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}

// API dates are plain YYYY-MM-DD strings. Parse them as local dates so
// they never shift a day because of the browser's timezone.
function parseDate(value) {
  const [year, month, day] = String(value ?? "").slice(0, 10).split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
}

export function formatDate(value, { withYear = true } = {}) {
  const date = parseDate(value);
  if (!date) return value || "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(date);
}

export function daysFromToday(value) {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date - today) / 86400000);
}

const CLOSED_STATUSES = ["paid", "cancelled", "void"];

// The API only stores open / paid / cancelled. "Overdue" is derived from
// the due date so open records past their due date stand out.
export function getPaymentStatus(record) {
  const status = String(record.status || "open").toLowerCase();
  if (CLOSED_STATUSES.includes(status)) return status;
  const days = daysFromToday(record.due_date);
  return days != null && days < 0 ? "overdue" : "open";
}

export function describeDueDate(record) {
  if (CLOSED_STATUSES.includes(getPaymentStatus(record))) return "";
  const days = daysFromToday(record.due_date);
  if (days == null) return "";
  if (days < 0) return `${-days} ${days === -1 ? "day" : "days"} overdue`;
  if (days === 0) return "Due today";
  return `Due in ${days} ${days === 1 ? "day" : "days"}`;
}

// overall_status from the risk endpoint is healthy | warning | critical.
export const RISK_TONE = { healthy: "green", warning: "amber", critical: "red" };

export const RISK_TITLES = {
  critical: "Cash goes below zero",
  warning: "Below minimum reserve",
};

// The risk endpoint returns one record per flagged day. Merge consecutive
// days with the same currency and severity into a single period.
export function groupRiskPeriods(risks = []) {
  const sorted = [...risks].sort((a, b) =>
    `${a.currency}|${a.date}`.localeCompare(`${b.currency}|${b.date}`)
  );
  const periods = [];

  for (const risk of sorted) {
    const last = periods.at(-1);
    const balance = Number(risk.closing_balance);
    const shortfall = Number(risk.reserve_shortfall || 0);
    const continues =
      last &&
      last.currency === risk.currency &&
      last.severity === risk.severity &&
      daysFromToday(risk.date) - daysFromToday(last.end) === 1;

    if (continues) {
      last.end = risk.date;
      last.days += 1;
      last.lowestBalance = Math.min(last.lowestBalance, balance);
      last.maxShortfall = Math.max(last.maxShortfall, shortfall);
    } else {
      periods.push({
        currency: risk.currency,
        severity: risk.severity,
        start: risk.date,
        end: risk.date,
        days: 1,
        lowestBalance: balance,
        maxShortfall: shortfall,
      });
    }
  }

  return periods.sort((a, b) => String(a.start).localeCompare(String(b.start)));
}

export const STATUS_PILL_CLASS = {
  open: "status-blue",
  overdue: "status-red",
  paid: "status-green",
  cancelled: "status-muted",
  void: "status-muted",
};
