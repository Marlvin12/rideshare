import { auth } from "@/config/firebase";
import {
  PhoneAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { useUserStore } from "@/store/userStore";
import { useRiderStore } from "@/store/riderStore";
import { useDeliveryStore } from "@/store/deliveryStore";
import { useEatsStore } from "@/store/eatsStore";
import { useCartStore } from "@/store/cartStore";
import { tokenStorage } from "@/store/storage";
import { resetAndNavigate } from "@/utils/Helpers";
import { Alert } from "react-native";
import axios from "axios";
import { BASE_URL } from "./config";
import type { ApplicationVerifier } from "@/components/shared/FirebaseRecaptcha";

export const sendOTP = async (
  phoneNumber: string,
  role: "customer" | "rider",
  countryCode: string,
  appVerifier?: ApplicationVerifier | null
): Promise<{
  success: boolean;
  verificationId?: string;
  fallback?: boolean;
  data?: any;
  httpStatus?: number;
  error?: string;
}> => {
  const fullPhoneNumber = `${countryCode}${phoneNumber}`;

  if (appVerifier && auth?.app?.options?.apiKey) {
    try {
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        fullPhoneNumber,
        appVerifier
      );
      return { success: true, verificationId };
    } catch (_firebaseErr) {
      // Fall through to server fallback
    }
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/auth/signin`,
      { role, phone: phoneNumber },
      {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    return {
      success: true,
      fallback: true,
      data: response.data,
      httpStatus: response.status,
    };
  } catch (fallbackError: any) {
    return {
      success: false,
      error: fallbackError?.response?.data?.msg || fallbackError?.message || "Authentication failed",
    };
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapFirebaseEmailError(err: { code?: string; message?: string }): string {
  const c = err?.code || "";
  if (c === "auth/email-already-in-use") {
    return "That email is already registered. Try signing in.";
  }
  if (c === "auth/invalid-email") {
    return "Invalid email address.";
  }
  if (c === "auth/weak-password") {
    return "Password is too weak. Use at least 6 characters.";
  }
  if (c === "auth/user-not-found" || c === "auth/wrong-password" || c === "auth/invalid-credential") {
    return "Email or password is incorrect.";
  }
  if (c === "auth/too-many-requests") {
    return "Too many attempts. Try again later.";
  }
  return err?.message || "Could not complete sign-in.";
}

export async function signInOrSignUpWithEmail(
  email: string,
  password: string,
  isSignUp: boolean,
  role: "customer" | "rider",
  updateAccessToken: () => void
): Promise<{ success: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) {
    return { success: false, error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }
  if (!auth?.app?.options?.apiKey) {
    return {
      success: false,
      error: "Firebase is not configured. Check EXPO_PUBLIC_FIREBASE_* in .env.",
    };
  }
  try {
    const cred = isSignUp
      ? await createUserWithEmailAndPassword(auth, normalized, password)
      : await signInWithEmailAndPassword(auth, normalized, password);
    const user = cred.user;
    const firebaseToken = await user.getIdToken();
    const response = await axios.post(
      `${BASE_URL}/auth/firebase-signin`,
      {
        firebaseToken,
        role,
        uid: user.uid,
        email: user.email ?? normalized,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        timeout: 20_000,
      }
    );

    const { setUser } = useUserStore.getState();
    const { setUser: setRiderUser } = useRiderStore.getState();
    const apiUser = response.data.user;

    if (apiUser.role === "customer") {
      setUser(apiUser);
    } else {
      setRiderUser(apiUser);
    }

    tokenStorage.set("access_token", response.data.access_token);
    tokenStorage.set("refresh_token", response.data.refresh_token);
    tokenStorage.set("firebase_uid", user.uid);

    const profilePhone = apiUser.phone || user.phoneNumber || apiUser.email || "";

    if (response.status === 201) {
      resetAndNavigate({
        pathname: "/complete-profile",
        params: {
          role: apiUser.role,
          phone: profilePhone,
        },
      });
    } else if (apiUser.role === "customer") {
      resetAndNavigate("/customer/home");
    } else {
      const skipKyc = process.env.EXPO_PUBLIC_SKIP_KYC === "1";
      const kycStatus = apiUser.kyc?.status || "pending";
      if (skipKyc || kycStatus === "approved") {
        resetAndNavigate("/rider/home");
      } else {
        resetAndNavigate("/rider/kyc-verification");
      }
    }

    updateAccessToken();
    return { success: true };
  } catch (error: any) {
    const msg = error?.response?.data?.msg;
    if (typeof msg === "string" && msg.length > 0) {
      return { success: false, error: msg };
    }
    return { success: false, error: mapFirebaseEmailError(error) };
  }
}

export const verifyOTP = async (
  verificationId: string,
  otp: string,
  role: "customer" | "rider",
  updateAccessToken: () => void
) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, otp);
    const userCredential = await signInWithCredential(auth, credential);

    const user = userCredential.user;
    const firebaseToken = await user.getIdToken();

    const response = await axios.post(
      `${BASE_URL}/auth/firebase-signin`,
      {
        firebaseToken,
        role,
        phone: user.phoneNumber,
        uid: user.uid,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    const { setUser } = useUserStore.getState();
    const { setUser: setRiderUser } = useRiderStore.getState();
    const apiUser = response.data.user;

    if (apiUser.role === "customer") {
      setUser(apiUser);
    } else {
      setRiderUser(apiUser);
    }

    tokenStorage.set("access_token", response.data.access_token);
    tokenStorage.set("refresh_token", response.data.refresh_token);
    tokenStorage.set("firebase_uid", user.uid);

    const displayPhone =
      apiUser.phone || user.phoneNumber || "";

    if (response.status === 201) {
      resetAndNavigate({
        pathname: "/complete-profile",
        params: {
          role: apiUser.role,
          phone: displayPhone,
        },
      });
    } else if (apiUser.role === "customer") {
      resetAndNavigate("/customer/home");
    } else {
      const skipKyc = process.env.EXPO_PUBLIC_SKIP_KYC === "1";
      const kycStatus = apiUser.kyc?.status || "pending";
      if (skipKyc || kycStatus === "approved") {
        resetAndNavigate("/rider/home");
      } else {
        resetAndNavigate("/rider/kyc-verification");
      }
    }

    updateAccessToken();
    return { success: true, user: apiUser };
  } catch (error: any) {
    console.error("OTP verification error:", error);
    Alert.alert(
      "Verification Failed",
      error?.response?.data?.msg || error?.message || "Invalid OTP. Please try again."
    );
    return { success: false, error: error?.message };
  }
};

export const signOutFirebase = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Firebase sign-out error:", error);
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
