import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("mingler_access_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle SimpleJWT 401 Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login/") ||
      originalRequest.url?.includes("/auth/token/refresh/") ||
      originalRequest.url?.includes("/auth/register/");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (typeof window === "undefined") {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem("mingler_refresh_token");
      if (!refreshToken) {
        // No refresh token available, dispatch logout
        window.dispatchEvent(new Event("mingler:auth:expired"));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = refreshResponse.data.access;
        localStorage.setItem("mingler_access_token", newAccessToken);

        if (refreshResponse.data.refresh) {
          localStorage.setItem("mingler_refresh_token", refreshResponse.data.refresh);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("mingler_access_token");
        localStorage.removeItem("mingler_refresh_token");
        localStorage.removeItem("mingler_user");
        localStorage.removeItem("mingler_profile");
        window.dispatchEvent(new Event("mingler:auth:expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Format DRF RFC 7807 and ValidationError payloads into a user-friendly string.
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") return data;
    if (data?.error?.message) return String(data.error.message);
    if (data?.message) return String(data.message);
    if (data?.detail) return String(data.detail);

    // Field-level DRF errors e.g. { email: ["Invalid email"], password: ["Too short"] }
    if (data?.error?.details && typeof data.error.details === "object") {
      const firstKey = Object.keys(data.error.details)[0];
      const val = data.error.details[firstKey];
      return Array.isArray(val) ? String(val[0]) : String(val);
    }
    if (typeof data === "object" && data !== null) {
      const firstKey = Object.keys(data)[0];
      const val = (data as Record<string, unknown>)[firstKey];
      if (Array.isArray(val)) return `${firstKey}: ${val[0]}`;
      if (typeof val === "string") return `${firstKey}: ${val}`;
    }
    if (error.message) return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}
