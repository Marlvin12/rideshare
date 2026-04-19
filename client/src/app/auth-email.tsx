import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "@/components/shared/CustomText";
import { useWS } from "@/service/WSProvider";
import { signInOrSignUpWithEmail } from "@/service/firebaseAuthService";

const PRIMARY = "#ac1d17";
const DISABLED_BTN = "#D1D5DB";

export default function AuthEmail() {
  const { updateAccessToken } = useWS();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [selectedRole, setSelectedRole] = useState<"customer" | "rider">("customer");
  const [loading, setLoading] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordOk = password.length >= 6;
  const confirmOk = mode === "signin" || password === confirm;
  const canSubmit = emailOk && passwordOk && confirmOk && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (mode === "signup" && password !== confirm) {
      Alert.alert("Passwords do not match", "Re-enter the same password in both fields.");
      return;
    }
    setLoading(true);
    try {
      const result = await signInOrSignUpWithEmail(
        email,
        password,
        mode === "signup",
        selectedRole,
        updateAccessToken
      );
      if (!result.success) {
        Alert.alert(mode === "signup" ? "Sign up failed" : "Sign in failed", result.error || "Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.topIconBtn}
          >
            <MaterialIcons name="arrow-back" size={26} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerIconWrap}>
            <MaterialIcons name="mark-email-unread" size={28} color={PRIMARY} />
          </View>
          <View style={styles.topIconBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <CustomText fontFamily="Bold" variant="h3" style={styles.title}>
            {mode === "signup" ? "Create account" : "Sign in with email"}
          </CustomText>
          <CustomText fontFamily="Regular" variant="h8" style={styles.subtitle}>
            {mode === "signup"
              ? "Use your email and a password (min. 6 characters)."
              : "Enter the email and password for your account."}
          </CustomText>

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeChip, mode === "signin" && styles.modeChipActive]}
              onPress={() => setMode("signin")}
            >
              <MaterialIcons
                name="login"
                size={18}
                color={mode === "signin" ? "#FFFFFF" : "#6B7280"}
              />
              <CustomText
                fontFamily="SemiBold"
                variant="h7"
                style={[styles.modeChipText, mode === "signin" && styles.modeChipTextActive]}
              >
                Log in
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeChip, mode === "signup" && styles.modeChipActive]}
              onPress={() => setMode("signup")}
            >
              <MaterialIcons
                name="person-add"
                size={18}
                color={mode === "signup" ? "#FFFFFF" : "#6B7280"}
              />
              <CustomText
                fontFamily="SemiBold"
                variant="h7"
                style={[styles.modeChipText, mode === "signup" && styles.modeChipTextActive]}
              >
                Sign up
              </CustomText>
            </TouchableOpacity>
          </View>

          <CustomText fontFamily="SemiBold" variant="h8" style={styles.label}>
            Email
          </CustomText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />

          <CustomText fontFamily="SemiBold" variant="h8" style={styles.label}>
            Password
          </CustomText>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 6 characters"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === "signup" ? "password-new" : "password"}
          />

          {mode === "signup" ? (
            <>
              <CustomText fontFamily="SemiBold" variant="h8" style={styles.label}>
                Confirm password
              </CustomText>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repeat password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          ) : null}

          <CustomText fontFamily="SemiBold" variant="h8" style={[styles.label, styles.roleLabel]}>
            I am a
          </CustomText>
          <View style={styles.rolePillContainer}>
            <TouchableOpacity
              style={[
                styles.rolePill,
                selectedRole === "customer" && styles.rolePillActive,
              ]}
              onPress={() => setSelectedRole("customer")}
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
              style={[styles.rolePill, selectedRole === "rider" && styles.rolePillActive]}
              onPress={() => setSelectedRole("rider")}
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
            style={[
              styles.cta,
              (!canSubmit || loading) && styles.ctaDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <CustomText fontFamily="Bold" variant="h6" style={styles.ctaText}>
                {mode === "signup" ? "Create account" : "Sign in"}
              </CustomText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  topIconBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(172, 29, 23, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    color: "#1F2937",
    fontSize: 26,
    marginTop: 8,
  },
  subtitle: {
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  modeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "transparent",
  },
  modeChipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  modeChipText: {
    color: "#6B7280",
    fontSize: 15,
  },
  modeChipTextActive: {
    color: "#FFFFFF",
  },
  label: {
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  roleLabel: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "#FAFAFA",
  },
  rolePillContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
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
  cta: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 28,
  },
  ctaDisabled: {
    backgroundColor: DISABLED_BTN,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 17,
  },
});
