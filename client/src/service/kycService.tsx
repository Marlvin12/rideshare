import axios from "axios";
import { BASE_URL } from "./config";
import { tokenStorage } from "@/store/storage";
import { Alert } from "react-native";
import { useRiderStore } from "@/store/riderStore";

export const submitKYC = async (kycData: {
  idType: string;
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  idFrontImage: string;
  idBackImage?: string;
}) => {
  try {
    const token = tokenStorage.getString("access_token");
    const res = await axios.post(`${BASE_URL}/kyc/submit`, kycData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    console.error("KYC submission error:", error);
    Alert.alert(
      "Submission Failed",
      error?.response?.data?.msg || "Failed to submit KYC information"
    );
    return { success: false, error: error?.response?.data?.msg };
  }
};

export const getKYCStatus = async () => {
  try {
    const token = tokenStorage.getString("access_token");
    const res = await axios.get(`${BASE_URL}/kyc/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const { user, setUser } = useRiderStore.getState();
    if (user?.role === "rider" && res.data?.kyc) {
      setUser({
        ...user,
        kyc: res.data.kyc,
      });
    }
    return { success: true, data: res.data };
  } catch (error: any) {
    console.error("Get KYC status error:", error);
    return { success: false, error: error?.response?.data?.msg };
  }
};

export const getRiderEarnings = async () => {
  try {
    const token = tokenStorage.getString("access_token");
    const res = await axios.get(`${BASE_URL}/kyc/earnings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    console.error("Get earnings error:", error);
    return { success: false, error: error?.response?.data?.msg };
  }
};

