import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error, fallbackMessage = "Request failed") {
  if (!axios.isAxiosError(error)) {
    return error?.message || fallbackMessage;
  }

  const serverMessage = error.response?.data?.message;
  if (serverMessage) {
    return serverMessage;
  }

  if (error.code === "ECONNABORTED") {
    return "Server took too long to respond. Please try again in a moment.";
  }

  if (error.code === "ERR_NETWORK" || !error.response) {
    return `Cannot reach the server at ${apiBaseUrl}. Please check that the backend is running.`;
  }

  return fallbackMessage;
}

export default api;
