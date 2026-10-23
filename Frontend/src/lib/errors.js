// FastAPI sends `detail` as a string for HTTP errors but as a list of
// validation issues for 422 responses. Only strings are safe to render.
export function getErrorMessage(error, fallback = "Something went wrong.") {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail) && detail.length) {
    return detail
      .map((issue) => (typeof issue?.msg === "string" ? issue.msg : JSON.stringify(issue)))
      .join(" ");
  }

  if (error?.request && !error?.response) {
    return "Could not reach the FlowPilot API. Check that the backend is running.";
  }

  return error?.message || fallback;
}
