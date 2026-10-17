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
