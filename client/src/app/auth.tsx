import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useRef } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import CustomText from "@/components/shared/CustomText";
import FirebaseRecaptcha, { type FirebaseRecaptchaRef } from "@/components/shared/FirebaseRecaptcha";
import PhoneInput from "@/components/shared/PhoneInput";
import { useWS } from "@/service/WSProvider";
import { sendOTP } from "@/service/firebaseAuthService";
import { useUserStore } from "@/store/userStore";
import { useRiderStore } from "@/store/riderStore";
import { tokenStorage } from "@/store/storage";
import { resetAndNavigate } from "@/utils/Helpers";

const PRIMARY = "#ac1d17";
const DISABLED_BTN = "#D1D5DB";

const Auth = () => {
  const { updateAccessToken } = useWS();
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<"customer" | "rider">("customer");
  const [loading, setLoading] = useState(false);
  const countryCodeRef = useRef("+263");
  const recaptchaRef = useRef<FirebaseRecaptchaRef>(null);

  const handleCountryCodeChange = (dialCode: string) => {
    countryCodeRef.current = dialCode;
  };

  const applyTokensAndUser = (data: {
    user: { role: string; kyc?: { status?: string } };
    access_token: string;
    refresh_token: string;
  }) => {
    const { setUser } = useUserStore.getState();
    const { setUser: setRiderUser } = useRiderStore.getState();
    if (data.user.role === "customer") {
      setUser(data.user as any);
    } else {
      setRiderUser(data.user as any);
    }
    tokenStorage.set("access_token", data.access_token);
    tokenStorage.set("refresh_token", data.refresh_token);
    updateAccessToken();
  };

  const navigateAfterLogin = (user: { role: string; kyc?: { status?: string } }) => {
    if (user.role === "customer") {
      resetAndNavigate("/customer/home");
    } else {
      const skipKyc = process.env.EXPO_PUBLIC_SKIP_KYC === "1";
      const kycStatus = user.kyc?.status || "pending";
      if (skipKyc || kycStatus === "approved") {
        resetAndNavigate("/rider/home");
      } else {
        resetAndNavigate("/rider/kyc-verification");
      }
    }
  };

  const handleFallbackReturning = (data: any) => {
    applyTokensAndUser(data);
    navigateAfterLogin(data.user);
  };

  const handleFallbackNewUser = (data: any, fullPhone: string) => {
    applyTokensAndUser(data);
    resetAndNavigate({
      pathname: "/complete-profile",
      params: {
        role: selectedRole,
        phone: fullPhone,
      },
    });
  };

  const handleContinue = async () => {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 7) {
      Alert.alert("Invalid number", "Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const appVerifier = recaptchaRef.current?.getVerifier() ?? null;
      const result = await sendOTP(trimmed, selectedRole, countryCodeRef.current, appVerifier);

      if (!result.success) {
        Alert.alert("Error", result.error || "Could not send verification code.");
        return;
      }

      const fullPhone = `${countryCodeRef.current}${trimmed.replace(/^0+/, "")}`;

      if (result.fallback && result.data) {
        if (result.httpStatus === 201) {
          handleFallbackNewUser(result.data, fullPhone);
        } else {
          handleFallbackReturning(result.data);
        }
        return;
      }

      router.push({
        pathname: "/otp-verify",
        params: {
          verificationId: result.verificationId,
          role: selectedRole,
          phone: fullPhone,
          rawPhone: trimmed.replace(/^0+/, ""),
          countryCode: countryCodeRef.current,
        },
      });
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const phoneReady = phone.trim().length >= 7;
  const canContinue = phoneReady && !loading;

  const continueBtnStyle = [
    styles.continueButton,
    loading && styles.continueButtonLoading,
    !phoneReady && !loading && styles.continueButtonDisabled,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptcha ref={recaptchaRef} />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.replace("/onboarding")}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.topIconBtn}
        >
          <MaterialIcons name="close" size={26} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Alert.alert("Support", "Support will be available soon.")}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.topIconBtn}
        >
          <MaterialIcons name="headset-mic" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <View style={styles.titleIconCircle}>
            <MaterialIcons name="person-add-alt-1" size={32} color={PRIMARY} />
          </View>
          <View style={styles.titleTextCol}>
            <CustomText fontFamily="Bold" variant="h3" style={styles.title}>
              Sign up or log in
            </CustomText>
            <CustomText fontFamily="Regular" variant="h8" style={styles.titleHint}>
              New here? Use phone or tap email below.
            </CustomText>
          </View>
        </View>

        <PhoneInput
          onChangeText={setPhone}
          value={phone}
          onCountryCodeChange={handleCountryCodeChange}
          accentColor={PRIMARY}
        />

        <View style={styles.rolePillContainer}>
          <TouchableOpacity
            style={[
              styles.rolePill,
              selectedRole === "customer" && styles.rolePillActive,
            ]}
            onPress={() => setSelectedRole("customer")}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="person"
              size={18}
              color={selectedRole === "customer" ? "#FFFFFF" : "#6B7280"}
            />
            <CustomText
              fontFamily="SemiBold"
              variant="h7"
              style={[
                styles.rolePillText,
                selectedRole === "customer" && styles.rolePillTextActive,
              ]}
            >
              Customer
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.rolePill,
              selectedRole === "rider" && styles.rolePillActive,
            ]}
            onPress={() => setSelectedRole("rider")}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="two-wheeler"
              size={18}
              color={selectedRole === "rider" ? "#FFFFFF" : "#6B7280"}
            />
            <CustomText
              fontFamily="SemiBold"
              variant="h7"
              style={[
                styles.rolePillText,
                selectedRole === "rider" && styles.rolePillTextActive,
              ]}
            >
              Rider
            </CustomText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={continueBtnStyle}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <CustomText
              fontFamily="Bold"
              variant="h6"
              style={[
                styles.continueText,
                !phoneReady && styles.continueTextMuted,
              ]}
            >
              Continue
            </CustomText>
          )}
        </TouchableOpacity>

        <CustomText fontFamily="Regular" variant="h8" style={styles.legalInline}>
          By continuing, you agree to our{" "}
          <CustomText
            fontFamily="SemiBold"
            variant="h8"
            style={styles.footerLink}
            onPress={() => Linking.openURL("https://rideshare.co.zw/legal/user-agreement")}
          >
            User Agreement
          </CustomText>{" "}
          and{" "}
          <CustomText
            fontFamily="SemiBold"
            variant="h8"
            style={styles.footerLink}
            onPress={() => Linking.openURL("https://rideshare.co.zw/legal/privacy-policy")}
          >
            Privacy Policy
          </CustomText>
          .
        </CustomText>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <CustomText fontFamily="Regular" variant="h8" style={styles.dividerText}>
            or
          </CustomText>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.emailButton}
          activeOpacity={0.7}
          onPress={() => router.push("/auth-email")}
        >
          <MaterialIcons name="mail-outline" size={22} color={PRIMARY} />
          <CustomText fontFamily="SemiBold" variant="h7" style={styles.emailText}>
            Continue with email
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topIconBtn: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  titleIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(183, 28, 28, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleTextCol: {
    flex: 1,
  },
  title: {
    color: "#1F2937",
    fontSize: 24,
    marginBottom: 4,
  },
  titleHint: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
  },
  rolePillContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
    marginBottom: 8,
  },
  rolePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  rolePillActive: {
    backgroundColor: PRIMARY,
  },
  rolePillText: {
    color: "#6B7280",
    fontSize: 15,
  },
  rolePillTextActive: {
    color: "#FFFFFF",
  },
  continueButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 24,
  },
  continueButtonLoading: {
    backgroundColor: PRIMARY,
  },
  continueButtonDisabled: {
    backgroundColor: DISABLED_BTN,
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 17,
  },
  continueTextMuted: {
    color: "#9CA3AF",
  },
  legalInline: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    textAlign: "center",
  },
  footerLink: {
    color: "#1F2937",
    textDecorationLine: "underline",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9CA3AF",
    fontSize: 13,
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 28,
    marginBottom: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emailText: {
    color: "#1F2937",
    fontSize: 15,
  },
});

export default Auth;
