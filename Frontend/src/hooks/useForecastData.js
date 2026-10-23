import { useCallback, useEffect, useState } from "react";
import { getForecast } from "../lib/companyApi";
import { getErrorMessage } from "../lib/errors";

export function useForecastData(initialDays = 30) {
  const [days, setDays] = useState(initialDays);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getForecast(days);
      setForecast(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load the forecast."));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    days,
    setDays,
    forecast,
    loading,
    error,
    refresh,
  };
}