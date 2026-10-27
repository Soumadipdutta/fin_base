import api from "./api";
import { COMPANY_ID } from "./config";
const companyPath = `/companies/${COMPANY_ID}`;

export const getCompany = () =>
  api.get(companyPath);

export const getAccounts = () =>
  api.get(`${companyPath}/accounts`);

export const getInvoices = () =>
  api.get(`${companyPath}/invoices`);

export const getObligations = () =>
  api.get(`${companyPath}/obligations`);

export const getForecast = (days = 30) =>
  api.get(`${companyPath}/forecast`, {
    params: { days },
  });

export const getRisks = () =>
  api.get(`${companyPath}/risks`);

export const getFinancialAlerts = (status) =>
  api.get(`${companyPath}/alerts`, {
    params: status ? { status } : {},
  });

export const generateFinancialAlerts = (days = 30) =>
  api.post(`${companyPath}/alerts/generate`, null, {
    params: { days },
  });

export const updateFinancialAlertStatus = (alertId, status) =>
  api.patch(`${companyPath}/alerts/${alertId}`, { status });

export const getSimulation = (params = {}) =>
  api.get(`${companyPath}/simulation`, {
    params,
  });

export const getOptimization = (payload = {}) =>
  api.post(`${companyPath}/optimization`, payload);


export const sendCopilotMessage = (message, history = []) =>
  api.post(`/companies/${COMPANY_ID}/copilot/chat`, {
    message,
    history,
  });

export async function streamCopilotMessage(
  message,
  conversationId,
  { onToken, onMeta } = {}
) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/companies/${import.meta.env.VITE_COMPANY_ID}/copilot/chat/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversation_id: conversationId || null,
      }),
    }
  );

  if (!response.ok) {
    let detail = `Copilot request failed (${response.status})`;

    try {
      const body = await response.json();
      detail =
        typeof body.detail === "string"
          ? body.detail
          : JSON.stringify(body.detail ?? body);
    } catch {
      // Keep the HTTP status message if the response isn't JSON.
    }

    throw new Error(detail);
  }

  if (!response.body) {
    throw new Error("The browser did not receive a readable response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult = null;

  function processEvent(eventText) {
    let eventName = "message";
    const dataLines = [];

    for (const line of eventText.split(/\r?\n/)) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (!dataLines.length) return;

    const payload = JSON.parse(dataLines.join("\n"));

    if (eventName === "meta") {
      onMeta?.(payload);
    } else if (eventName === "token") {
      onToken?.(payload.token ?? "");
    } else if (eventName === "done") {
      finalResult = payload;
    } else if (eventName === "error") {
  throw new Error(
    payload.detail ||
      payload.message ||
      "Copilot streaming failed."
  );
}
  }

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";

      for (const eventText of events) {
        processEvent(eventText);
      }
    }

    // Process a final event even if the stream ends without a blank line.
    if (buffer.trim()) {
      processEvent(buffer);
    }

    if (!finalResult) {
      throw new Error("The stream ended without a final completion event.");
    }

    return finalResult;
  } finally {
    reader.releaseLock();
  }
}


export const getCopilotMemories = () =>
  api.get(`/companies/${COMPANY_ID}/copilot/memories`);

export const deleteCopilotMemory = (memoryId) =>
  api.delete(
    `/companies/${COMPANY_ID}/copilot/memories/${memoryId}`
  );

export const getCopilotConversations = () =>
  api.get(`/companies/${COMPANY_ID}/copilot/conversations`);

export const getCopilotConversationMessages = (conversationId) =>
  api.get(
    `/companies/${COMPANY_ID}/copilot/conversations/${encodeURIComponent(conversationId)}/messages`
  );

export const deleteCopilotConversation = (conversationId) =>
  api.delete(
    `/companies/${COMPANY_ID}/copilot/conversations/${encodeURIComponent(conversationId)}`
  );


export async function previewScenario(params = {}) {
  const response = await api.post(
    `/companies/${COMPANY_ID}/scenarios/preview`,
    {
      days: params.days ?? 30,
      payment_delay_days: params.payment_delay_days ?? 0,
      revenue_reduction_pct: params.revenue_reduction_pct ?? 0,
      expense_increase_pct: params.expense_increase_pct ?? 0,
    }
  );

  return response.data;
}


export async function saveScenario(params = {}) {
  const response = await api.post(
    `/companies/${COMPANY_ID}/scenarios`,
    {
      name: params.name ?? "Untitled scenario",
      days: params.days ?? 30,
      payment_delay_days: params.payment_delay_days ?? 0,
      revenue_reduction_pct: params.revenue_reduction_pct ?? 0,
      expense_increase_pct: params.expense_increase_pct ?? 0,
    }
  );

  return response.data;
}

export async function getSavedScenarios() {
  const response = await api.get(
    `/companies/${COMPANY_ID}/scenarios`
  );

  return response.data;
}

export async function getSavedScenario(scenarioId) {
  const response = await api.get(
    `/companies/${COMPANY_ID}/scenarios/${scenarioId}`
  );

  return response.data;
}

export async function deleteSavedScenario(scenarioId) {
  const response = await api.delete(
    `/companies/${COMPANY_ID}/scenarios/${scenarioId}`
  );

  return response.status === 204;
}

export async function compareScenarios(scenarioIds = []) {
  const results = await Promise.all(
    scenarioIds.map(async (id) => {
      const scenario = await getSavedScenario(id);

      const preview = await previewScenario({
        days: scenario.days,
        payment_delay_days: scenario.payment_delay_days,
        revenue_reduction_pct: Number(
          scenario.revenue_reduction_pct
        ),
        expense_increase_pct: Number(
          scenario.expense_increase_pct
        ),
      });

      return {
        scenario,
        preview,
      };
    })
  );

  return results;
}


export const getOptimizationHistory = (params = {}) =>
  api.get(`${companyPath}/optimization/history`, { params });
