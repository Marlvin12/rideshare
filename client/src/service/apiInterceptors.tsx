import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { BASE_URL } from "./config";
import { tokenStorage } from "@/store/storage";
import { logout } from "./authService";

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  pendingQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  pendingQueue = [];
};

export const refresh_tokens = async (): Promise<string | undefined> => {
  const refreshToken = tokenStorage.getString("refresh_token");
  if (!refreshToken) {
    tokenStorage.clearAuth();
    logout();
    return undefined;
  }

  const response = await axios.post(
    `${BASE_URL}/auth/refresh-token`,
    { refresh_token: refreshToken },
    {
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      timeout: 12_000,
    }
  );

  const new_access_token = response.data.access_token;
  const new_refresh_token = response.data.refresh_token;

  tokenStorage.set("access_token", new_access_token);
  tokenStorage.set("refresh_token", new_refresh_token);
  return new_access_token;
};

export const appAxios = axios.create({
  baseURL: BASE_URL,
});

appAxios.interceptors.request.use(async (config) => {
  config.headers["ngrok-skip-browser-warning"] = "true";
  const accessToken = tokenStorage.getString("access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

appAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refresh_tokens();
      if (newToken) {
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      }
      processQueue(new Error("Token refresh returned empty"), null);
      return Promise.reject(error);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      tokenStorage.clearAuth();
      logout();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
