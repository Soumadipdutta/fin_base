
import { useCallback, useEffect, useState } from "react";
import api from "../lib/api";
import { COMPANY_ID } from "../lib/config";

export function useApiStatus() {
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");

  const checkStatus = useCallback(async () => {
    try {
      const response = await api.get(`/companies/${COMPANY_ID}`, {
        timeout: 3000,
      });

      setStatus(
        response.status >= 200 && response.status < 300
          ? "connected"
          : "disconnected"
      );
      setError("");
    } catch (err) {
      setStatus("disconnected");
      setError(
        err.response
          ? `HTTP ${err.response.status}`
          : err.code === "ECONNABORTED"
            ? "Request timed out"
            : "Backend unreachable"
      );
    }
  }, []);

  useEffect(() => {
    checkStatus();

    const intervalId = setInterval(checkStatus, 5000);

    return () => clearInterval(intervalId);
  }, [checkStatus]);

  return { status, error, checkStatus };
}
