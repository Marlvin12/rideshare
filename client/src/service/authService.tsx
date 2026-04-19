import { useRiderStore } from "@/store/riderStore";
import { useDeliveryStore } from "@/store/deliveryStore";
import { useEatsStore } from "@/store/eatsStore";
import { useCartStore } from "@/store/cartStore";
import { tokenStorage } from "@/store/storage";
import { useUserStore } from "@/store/userStore";
import { resetAndNavigate } from "@/utils/Helpers";
import axios from "axios";
import { Alert } from "react-native";
import { BASE_URL } from "./config";

export type ProfileUpdatePayload = {
  firstName: string;
  lastName: string;
  whatsapp: string;
  gender?: "male" | "female";
  residencyType?: "resident" | "visitor";
  marketingOptOut?: boolean;
};

export const updateUserProfile = async (payload: ProfileUpdatePayload) => {
  const token = tokenStorage.getString("access_token");
  if (!token) {
    throw new Error("Not authenticated");
  }
  const body: Record<string, unknown> = {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    whatsapp: payload.whatsapp.trim(),
    marketingOptOut: Boolean(payload.marketingOptOut),
  };
  if (payload.gender) {
    body.gender = payload.gender;
  }
  if (payload.residencyType) {
    body.residencyType = payload.residencyType;
  }
  const res = await axios.patch(`${BASE_URL}/auth/profile`, body, {
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });
  const u = res.data.user;
  if (u.role === "customer") {
    useUserStore.getState().setUser(u);
  } else {
    useRiderStore.getState().setUser(u);
  }
  return u;
};

export const signin = async (
  payload: {
    role: "customer" | "rider";
    phone: string;
  },
  updateAccessToken: () => void
) => {
  const { setUser } = useUserStore.getState();
  const { setUser: setRiderUser } = useRiderStore.getState();

  try {
    const res = await axios.post(`${BASE_URL}/auth/signin`, payload, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (res.data.user.role === "customer") {
      setUser(res.data.user);
    } else {
      setRiderUser(res.data.user);
    }

    tokenStorage.set("access_token", res.data.access_token);
    tokenStorage.set("refresh_token", res.data.refresh_token);

    if (res.data.user.role === "customer") {
      resetAndNavigate("/customer/home");
    } else {
      const skipKyc = process.env.EXPO_PUBLIC_SKIP_KYC === "1";
      const kycStatus = res.data.user.kyc?.status || "pending";
      if (skipKyc || kycStatus === "approved") {
        resetAndNavigate("/rider/home");
      } else {
        resetAndNavigate("/rider/kyc-verification");
      }
    }

    updateAccessToken();
  } catch (error: any) {
    let errorMessage = "Unable to connect to server";

    if (error?.code === "ECONNABORTED") {
      errorMessage = "Connection timeout. Please check your network.";
    } else if (error?.code === "ERR_NETWORK" || error?.message?.includes("Network Error")) {
      errorMessage = "Network error. Make sure the server is running at " + BASE_URL;
    } else if (error?.response?.data?.msg) {
      errorMessage = error.response.data.msg;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    Alert.alert("Sign-in Error", errorMessage);
  }
};

export const logout = async (disconnect?: () => void) => {
  if (disconnect) {
    disconnect();
  }

  const { clearData } = useUserStore.getState();
  const { clearRiderData } = useRiderStore.getState();
  const { clearDeliveryData } = useDeliveryStore.getState();
  const { clearEatsData } = useEatsStore.getState();
  const { clearCart } = useCartStore.getState();

  tokenStorage.clearAuth();
  clearData();
  clearRiderData();
  clearDeliveryData();
  clearEatsData();
  clearCart();
  resetAndNavigate("/auth");
};
