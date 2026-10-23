
function csvEscape(value) {
  const text =
    value == null
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename, rows) {
  if (!rows.length) {
    throw new Error("There is no data to export.");
  }

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportOptimizationHistory(runs) {
  const rows = [
    [
      "Run ID",
      "Created At",
      "Horizon Days",
      "Recommendation Count",
      "Schedule Safe",
      "Breach Count",
    ],
    ...runs.map((run) => [
      run.id,
      run.created_at,
      run.horizon_days,
      run.recommendation_count,
      run.is_safe,
      run.breach_count,
    ]),
  ];

  downloadCsv("flowpilot-optimization-history.csv", rows);
}

export function exportRunRecommendations(run) {
  const recommendations = run?.result?.recommendations ?? [];

  const rows = [
    [
      "Run ID",
      "Obligation ID",
      "Currency",
      "Amount",
      "Original Due Date",
      "Recommended Date",
      "Priority",
      "Reason",
      "Expected Benefit",
    ],
    ...recommendations.map((item) => [
      run.id,
      item.obligation_id,
      item.currency,
      item.amount,
      item.original_due_date,
      item.recommended_date,
      item.priority,
      item.reason,
      item.expected_benefit,
    ]),
  ];

  downloadCsv(`flowpilot-run-${run.id}-recommendations.csv`, rows);
}
