import {
  getCompany,
  getAccounts,
  getInvoices,
  getObligations,
  getForecast,
  getRisks,
} from "./companyApi";

export async function testCompanyApi() {
  const requests = [
    ["Company", getCompany],
    ["Accounts", getAccounts],
    ["Invoices", getInvoices],
    ["Obligations", getObligations],
    ["Forecast", getForecast],
    ["Risks", getRisks],
  ];

  const results = await Promise.allSettled(
    requests.map(async ([name, request]) => {
      const response = await request();
      return {
        name,
        status: response.status,
        data: response.data,
      };
    })
  );

  results.forEach((result, index) => {
    const name = requests[index][0];

    if (result.status === "fulfilled") {
      console.log(`✅ ${name}`, result.value.data);
    } else {
      console.error(`❌ ${name}`, result.reason);
    }
  });
}