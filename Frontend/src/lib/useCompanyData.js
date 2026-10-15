import { useCallback, useEffect, useState } from "react";
import {
  getCompany,
  getAccounts,
  getInvoices,
  getObligations,
  getForecast,
  getRisks,
} from "./companyApi";

export default function useCompanyData() {
  const [data, setData] = useState({
    company: null,
    accounts: [],
    invoices: [],
    obligations: [],
    forecast: null,
    risks: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.all([
        getCompany(),
        getAccounts(),
        getInvoices(),
        getObligations(),
        getForecast(30),
        getRisks(),
      ]);

      setData({
        company: results[0].data,
        accounts: results[1].data,
        invoices: results[2].data,
        obligations: results[3].data,
        forecast: results[4].data,
        risks: results[5].data,
      });
    } catch (err) {
      console.error("Failed to load FlowPilot data:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to load company data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}