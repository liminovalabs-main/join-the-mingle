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
 * Sanitize and unpack raw Python ErrorDetail, dictionary, or array strings.
 */
function cleanErrorString(raw: string): string {
  if (!raw) return "";

  // 1. Python ErrorDetail dump: ErrorDetail(string='Invalid email or password.', code='invalid')
  const detailMatch = raw.match(/ErrorDetail\(string=['"]([^'"]+)['"]/);
  if (detailMatch && detailMatch[1]) {
    return detailMatch[1];
  }

  // 2. Python dictionary with non_field_errors e.g. {'non_field_errors': ['...']}
  const dictMatch = raw.match(/['"]non_field_errors['"]\s*:\s*\[?['"]([^'"]+)['"]/);
  if (dictMatch && dictMatch[1]) {
    return dictMatch[1];
  }

  // 3. String wrapped in array quotes e.g. ["Invalid email or password."]
  const bracketMatch = raw.match(/^\[['"]([^'"]+)['"]\]$/);
  if (bracketMatch && bracketMatch[1]) {
    return bracketMatch[1];
  }

  return raw;
}

/**
 * Format DRF RFC 7807 and ValidationError payloads into a user-friendly string.
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") return cleanErrorString(data);

    // 1. Check structured error details (RFC 7807)
    if (data?.error?.details && typeof data.error.details === "object") {
      const details = data.error.details as Record<string, unknown>;
      if (details.non_field_errors) {
        const val = details.non_field_errors;
        return cleanErrorString(Array.isArray(val) ? String(val[0]) : String(val));
      }
      if (details.detail) {
        const val = details.detail;
        return cleanErrorString(Array.isArray(val) ? String(val[0]) : String(val));
      }
      const firstKey = Object.keys(details)[0];
      if (firstKey) {
        const val = details[firstKey];
        return cleanErrorString(Array.isArray(val) ? String(val[0]) : String(val));
      }
    }

    // 2. Check direct non_field_errors in raw DRF responses
    if (data?.non_field_errors) {
      const val = data.non_field_errors;
      return cleanErrorString(Array.isArray(val) ? String(val[0]) : String(val));
    }

    // 3. Check error.message
    if (data?.error?.message) {
      return cleanErrorString(String(data.error.message));
    }

    if (data?.message) return cleanErrorString(String(data.message));
    if (data?.detail) return cleanErrorString(String(data.detail));

    // 4. Raw object with field keys e.g. { password: ["This password is too short."] }
    if (typeof data === "object" && data !== null) {
      const keys = Object.keys(data).filter((k) => k !== "success" && k !== "error");
      if (keys.length > 0) {
        const firstKey = keys[0];
        const val = (data as Record<string, unknown>)[firstKey];
        if (firstKey === "non_field_errors") {
          return cleanErrorString(Array.isArray(val) ? String(val[0]) : String(val));
        }
        if (Array.isArray(val)) return `${firstKey}: ${cleanErrorString(String(val[0]))}`;
        if (typeof val === "string") return `${firstKey}: ${cleanErrorString(val)}`;
      }
    }

    if (error.message) return cleanErrorString(error.message);
  }
  return "An unexpected error occurred. Please try again.";
}
