import { useCallback, useEffect, useState } from "react";
import {
  getCompany,
  getAccounts,
  getInvoices,
  getObligations,
  getForecast,
  getRisks,
  getFinancialAlerts,
} from "../lib/companyApi";

export function useDashboardData() {
  const [data, setData] = useState({
    company: null,
    accounts: [],
    invoices: [],
    obligations: [],
    forecast: null,
    risks: null,
    alerts: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    const requests = await Promise.allSettled([
      getCompany(),
      getAccounts(),
      getInvoices(),
      getObligations(),
      getForecast(30),
      getRisks(),
      getFinancialAlerts(),
    ]);

    const names = [
      "company",
      "accounts",
      "invoices",
      "obligations",
      "forecast",
      "risks",
      "alerts",
    ];

    const nextData = {};
    const failures = [];

    requests.forEach((result, index) => {
      const name = names[index];

      if (result.status === "fulfilled") {
nextData[name] =
  name === "alerts"
    ? result.value.data.alerts || []
    : result.value.data;      } else {
        nextData[name] = data[name];
        failures.push(name);
        console.error(`Failed to load ${name}:`, result.reason);
      }
    });

    setData((previous) => ({ ...previous, ...nextData }));

    if (failures.length) {
      setError(`Could not load: ${failures.join(", ")}. Check the backend.`);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}