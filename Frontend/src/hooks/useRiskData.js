import { useCallback, useEffect, useState } from "react";
import {
  getRisks,
  getSimulation,
  getOptimization,
  getObligations,
} from "../lib/companyApi";
import { getErrorMessage } from "../lib/errors";

export function useRiskData() {
  const [risks, setRisks] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [obligations, setObligations] = useState([]);
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
      setError(getErrorMessage(err, "Could not load risk data."));
    } finally {
      setLoading(false);
    }
  }, []);

  const runSimulation = useCallback(async () => {
    setSimulationLoading(true);
    setError("");

    try {
      // Uses the backend defaults: 30 days, 1,000 runs, receipts delayed up to 7 days.
      const response = await getSimulation();
      setSimulation(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not run the simulation."));
    } finally {
      setSimulationLoading(false);
    }
  }, []);

  const loadOptimization = useCallback(async () => {
    setOptimizationLoading(true);
    setError("");

    try {
      // Obligations are only used to label recommendations, so a failure
      // there should not hide the optimization result.
      const [response, obligationsResponse] = await Promise.all([
        getOptimization({}),
        getObligations().catch(() => null),
      ]);
      setOptimization(response.data);
      if (Array.isArray(obligationsResponse?.data)) {
        setObligations(obligationsResponse.data);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not load optimization results."));
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
    obligations,
    loading,
    simulationLoading,
    optimizationLoading,
    error,
    refreshRisks,
    runSimulation,
    loadOptimization,
  };
}
