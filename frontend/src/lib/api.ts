import axios from "axios";

const apiBase = (() => {
  // If an explicit public API URL is configured, always use it.
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/api`;
  }

  // Server-side (SSR) inside Docker.
  if (typeof window === "undefined") {
    return `${process.env.BACKEND_INTERNAL_URL || "http://backend:3001"}/api`;
  }

  // Browser: use Next.js rewrites.
  return "/api";
})();

export const api = axios.create({
  baseURL: apiBase,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

console.log("[API] Base URL:", apiBase);