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
