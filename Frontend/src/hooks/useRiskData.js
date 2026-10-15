import { useCallback, useEffect, useState } from "react";
import {
  getRisks,
  getSimulation,
  getOptimization,
} from "../lib/companyApi";

export function useRiskData() {
  const [risks, setRisks] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshRisks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getRisks();
      setRisks(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Could not load risk data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const runSimulation = useCallback(async () => {
    setSimulationLoading(true);
    setError("");

    try {
      // Uses backend defaults until the simulation parameter schema is confirmed.
      const response = await getSimulation();
      setSimulation(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Could not run the simulation."
      );
    } finally {
      setSimulationLoading(false);
    }
  }, []);

  const loadOptimization = useCallback(async () => {
    setOptimizationLoading(true);
    setError("");

    try {
      // The optimization endpoint may require a request body.
      const response = await getOptimization({});
      setOptimization(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Could not load optimization results."
      );
    } finally {
      setOptimizationLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRisks();
  }, [refreshRisks]);

  return {
    risks,
    simulation,
    optimization,
    loading,
    simulationLoading,
    optimizationLoading,
    error,
    refreshRisks,
    runSimulation,
    loadOptimization,
  };
}