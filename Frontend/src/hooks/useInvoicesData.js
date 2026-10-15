import { useCallback, useEffect, useState } from "react";
import { getInvoices, getObligations } from "../lib/companyApi";

export function useInvoicesData() {
  const [invoices, setInvoices] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      getInvoices(),
      getObligations(),
    ]);

    const errors = [];

    if (results[0].status === "fulfilled") {
      const data = results[0].value.data;
      setInvoices(Array.isArray(data) ? data : data.items || data.invoices || []);
    } else {
      errors.push("Invoices could not be loaded.");
    }

    if (results[1].status === "fulfilled") {
      const data = results[1].value.data;
      setObligations(Array.isArray(data) ? data : data.items || data.obligations || []);
    } else {
      errors.push("Payment obligations could not be loaded.");
    }

    setError(errors.join(" "));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { invoices, obligations, loading, error, refresh };
}