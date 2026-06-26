import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 15000
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function getApiError(error) {
  const data = error?.response?.data;

  if (Array.isArray(data?.issues) && data.issues.length > 0) {
    return data.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
  }

  return data?.message || error?.message || "Request failed";
}
