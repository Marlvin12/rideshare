import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StatusBar,
  Keyboard,
  Modal,
  ActivityIndicator,
} from "react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import CustomText from "@/components/shared/CustomText";
import FirebaseRecaptcha, { type FirebaseRecaptchaRef } from "@/components/shared/FirebaseRecaptcha";
import { sendOTP, verifyOTP } from "@/service/firebaseAuthService";
import { useWS } from "@/service/WSProvider";

const PRIMARY = "#B71C1C";
const RESEND_DELAY_SECONDS = 30;

const OTPVerify = () => {
  const { verificationId: initialVerificationId, role, phone, rawPhone, countryCode } =
    useLocalSearchParams<{
      verificationId: string;
      role: string;
      phone: string;
      rawPhone: string;
      countryCode: string;
    }>();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [activeVerificationId, setActiveVerificationId] = useState(initialVerificationId);
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY_SECONDS);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputs = useRef<Array<TextInput | null>>([]);
  const recaptchaRef = useRef<FirebaseRecaptchaRef>(null);
  const { updateAccessToken } = useWS();
  const verifyAttempted = useRef(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    const timeout = setTimeout(() => inputs.current[0]?.focus(), 300);
    return () => clearTimeout(timeout);
  }, []);

  const handleChange = useCallback(
    (text: string, index: number) => {
      if (text.length > 1) {
        const digits = text.replace(/\D/g, "").split("").slice(0, 6);
        const newOtp = [...otp];
        digits.forEach((d, i) => {
          if (i + index < 6) newOtp[i + index] = d;
        });
        setOtp(newOtp);
        const nextFocus = Math.min(index + digits.length, 5);
        inputs.current[nextFocus]?.focus();
        if (newOtp.every((d) => d !== "")) {
          Keyboard.dismiss();
        }
        return;
      }

      const newOtp = [...otp];
      newOtp[index] = text.replace(/\D/g, "");
      setOtp(newOtp);

      if (text && index < 5) {
        inputs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyPress = useCallback(
    (e: any, index: number) => {
      if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const otpCode = otp.join("");
  const isComplete = otpCode.length === 6;

  const runVerify = useCallback(async () => {
    if (!isComplete || verifyAttempted.current) return;
    verifyAttempted.current = true;
    setLoading(true);
    try {
      const result = await verifyOTP(
        activeVerificationId!,
        otpCode,
        role as "customer" | "rider",
        updateAccessToken
      );
      if (!result?.success) {
        verifyAttempted.current = false;
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  }, [activeVerificationId, isComplete, otpCode, role, updateAccessToken]);

  useEffect(() => {
    if (otpCode.length !== 6 || loading) return;
    const t = setTimeout(() => {
      void runVerify();
    }, 350);
    return () => clearTimeout(t);
  }, [otpCode, loading, runVerify]);

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResendTimer(RESEND_DELAY_SECONDS);
    verifyAttempted.current = false;

    try {
      const appVerifier = recaptchaRef.current?.getVerifier() ?? null;
      const result = await sendOTP(
        rawPhone!,
        role as "customer" | "rider",
        countryCode!,
        appVerifier
      );

      if (result.success && result.verificationId) {
        setActiveVerificationId(result.verificationId);
        Alert.alert("Code sent", "A new verification code has been sent.");
      } else if (result.fallback && result.data) {
        Alert.alert(
          "Check your device",
          "This number may use instant sign-in instead of SMS."
        );
      } else if (!result.success) {
        Alert.alert("Error", result.error || "Failed to resend code.");
      }
    } catch {
      Alert.alert("Error", "Failed to resend verification code.");
    }
  };

  const maskedPhone = phone || "your phone";

  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptcha ref={recaptchaRef} />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      <View style={styles.content}>
        <CustomText variant="h3" fontFamily="Bold" style={styles.title}>
          Enter verification code
        </CustomText>
        <CustomText variant="h7" fontFamily="Regular" style={styles.subtitle}>
          Verification code will be sent to
        </CustomText>
        <View style={styles.phonePill}>
          <CustomText variant="h7" fontFamily="SemiBold" style={styles.phonePillText}>
            {maskedPhone}
          </CustomText>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                focusedIndex === index ? styles.otpBoxFocused : null,
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleResend}
          disabled={resendTimer > 0}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.resendWrap}
        >
          <CustomText
            variant="h8"
            fontFamily="SemiBold"
            style={[
              styles.resendLink,
              resendTimer > 0 && styles.resendLinkDisabled,
            ]}
          >
            {resendTimer > 0 ? `Send again in ${resendTimer}s` : "Send again"}
          </CustomText>
        </TouchableOpacity>
      </View>

      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <CustomText fontFamily="Bold" variant="h6" style={styles.loadingText}>
              Loading...
            </CustomText>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  title: {
    color: "#1F2937",
    fontSize: 26,
    marginBottom: 12,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 15,
    marginBottom: 10,
  },
  phonePill: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 32,
    alignSelf: "stretch",
  },
  phonePillText: {
    color: "#1F2937",
    fontSize: 15,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 24,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Bold",
    color: "#1F2937",
    backgroundColor: "#FAFAFA",
  },
  otpBoxFilled: {
    borderColor: PRIMARY,
    backgroundColor: "#FFFFFF",
  },
  otpBoxFocused: {
    borderColor: PRIMARY,
  },
  resendWrap: {
    alignSelf: "flex-start",
  },
  resendLink: {
    color: "#6B7280",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  resendLinkDisabled: {
    color: "#D1D5DB",
    textDecorationLine: "none",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: "rgba(100,100,100,0.92)",
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 48,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 17,
  },
});

export default OTPVerify;
