import axios, { AxiosInstance } from "axios";
import { Platform } from "react-native";
import { getAuth, type Auth } from "firebase/auth";
import { app } from "@/config/firebase";

/**
 * paymentsService — vertical-agnostic mobile-money payments against loko-api
 * (the canonical Postgres backend, same host as the rental/eats verticals).
 *
 * NOTE: this is intentionally distinct from the rides-specific `paymentService`
 * (singular), which talks to the rideshare/Mongo server. Do not confuse them.
 *
 * loko-api endpoints:
 *   POST /payments/initiate   { subject_type, subject_id, method, phone, idempotency_key? }
 *                             -> { paymentId, status: 'pending', instructions }
 *   GET  /payments/:id/status -> { paymentId, status }
 *
 * Both require a Firebase ID token (Bearer). The amount is resolved
 * server-side, so we never send an amount from the client.
 */

const DEFAULT_LOKO_PORT = 4000;

const devFallback =
  typeof __DEV__ !== "undefined" && __DEV__
    ? Platform.OS === "android"
      ? `http://10.0.2.2:${DEFAULT_LOKO_PORT}`
      : `http://localhost:${DEFAULT_LOKO_PORT}`
    : "";

// loko-api hosts the rental + eats verticals; the new /payments endpoints
// live on the same host. Reuse the rental base URL env (fall back to eats).
let LOKO_API_URL =
  process.env.EXPO_PUBLIC_RENTAL_API_URL?.trim() ||
  process.env.EXPO_PUBLIC_EATS_API_URL?.trim() ||
  devFallback;

if (
  Platform.OS === "android" &&
  LOKO_API_URL &&
  (LOKO_API_URL.includes("localhost") || LOKO_API_URL.includes("127.0.0.1"))
) {
  LOKO_API_URL = LOKO_API_URL.replace(/localhost/g, "10.0.2.2").replace(
    /127\.0\.0\.1/g,
    "10.0.2.2"
  );
}

const lokoAxios: AxiosInstance = axios.create({
  baseURL: LOKO_API_URL,
  timeout: 20_000,
});

// Inject a fresh Firebase ID token on every request — loko-api authenticates
// via Firebase, unlike the rideshare server's own access_token.
lokoAxios.interceptors.request.use(async (config) => {
  config.headers["ngrok-skip-browser-warning"] = "true";
  const auth: Auth = getAuth(app);
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type PaymentSubjectType = "food" | "rental";
export type PaymentMethod = "ecocash" | "onemoney";
export type PaymentStatus =
  | "initiated"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export interface InitiatePaymentParams {
  subjectType: PaymentSubjectType;
  subjectId: string;
  method: PaymentMethod;
  phone: string;
  idempotencyKey?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  paymentId?: string;
  status?: PaymentStatus;
  instructions?: string;
  error?: string;
}

export interface PaymentStatusResult {
  success: boolean;
  paymentId?: string;
  status?: PaymentStatus;
  error?: string;
}

/**
 * Kick off a mobile-money collection. The server resolves the amount from the
 * subject (food order / rental booking), so no amount is sent.
 */
export const initiatePayment = async ({
  subjectType,
  subjectId,
  method,
  phone,
  idempotencyKey,
}: InitiatePaymentParams): Promise<InitiatePaymentResult> => {
  try {
    const response = await lokoAxios.post("/payments/initiate", {
      subject_type: subjectType,
      subject_id: subjectId,
      method,
      phone,
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
    });
    const data = response.data ?? {};
    return {
      success: true,
      paymentId: data.paymentId,
      status: data.status,
      instructions: data.instructions,
    };
  } catch (error: any) {
    const data = error?.response?.data;
    if (!error?.response) {
      return { success: false, error: "You appear to be offline." };
    }
    return {
      success: false,
      error: data?.message || data?.msg || error?.message || "Failed to start payment.",
    };
  }
};

/**
 * Poll the status of a payment. Status is one of initiated|pending|paid|
 * failed|cancelled|refunded.
 */
export const getPaymentStatus = async (
  paymentId: string
): Promise<PaymentStatusResult> => {
  try {
    const response = await lokoAxios.get(`/payments/${paymentId}/status`);
    const data = response.data ?? {};
    return {
      success: true,
      paymentId: data.paymentId,
      status: data.status,
    };
  } catch (error: any) {
    const data = error?.response?.data;
    if (!error?.response) {
      return { success: false, error: "You appear to be offline." };
    }
    return {
      success: false,
      error: data?.message || data?.msg || error?.message || "Failed to fetch payment status.",
    };
  }
};

export const isTerminalStatus = (status?: PaymentStatus): boolean =>
  status === "paid" ||
  status === "failed" ||
  status === "cancelled" ||
  status === "refunded";
