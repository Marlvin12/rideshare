import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "@/components/shared/CustomText";
import { appAxios } from "@/service/apiInterceptors";

const DARK_BG = "#000000";
const CARD_BG = "#1C1C1E";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#8E8E93";
const DIVIDER = "#2C2C2E";
const ACCENT = "#ac1d17";
const GREEN = "#34D399";

interface Promo {
  _id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validUntil: string;
}

const PromotionsScreen = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [appliedResult, setAppliedResult] = useState<{ discount: number; code: string } | null>(null);

  const fetchPromos = useCallback(async () => {
    try {
      const res = await appAxios.get("/customer/promotions");
      if (res.data.success) {
        setPromos(res.data.promos);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handleApplyCode = async () => {
    if (!code.trim()) {
      Alert.alert("Required", "Enter a promo code.");
      return;
    }
    setApplying(true);
    setAppliedResult(null);
    try {
      const res = await appAxios.post("/customer/promotions/apply", {
        code: code.trim(),
        subtotal: 10,
      });
      if (res.data.success) {
        setAppliedResult({ discount: res.data.discount, code: res.data.code });
        Alert.alert("Applied", `Discount of $${res.data.discount.toFixed(2)} will apply to your next order.`);
      }
    } catch (err: any) {
      Alert.alert("Invalid", err?.response?.data?.msg || "Could not apply code");
    } finally {
      setApplying(false);
    }
  };

  const formatDiscount = (promo: Promo) => {
    if (promo.discountType === "percentage") {
      return `${promo.discountValue}% off`;
    }
    return `$${promo.discountValue.toFixed(2)} off`;
  };

  const formatExpiry = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={DARK_BG} translucent={false} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={RFValue(22)} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <CustomText fontFamily="SemiBold" fontSize={18} style={styles.headerTitle}>
            Promotions
          </CustomText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.applySection}>
            <CustomText fontFamily="SemiBold" fontSize={16} style={styles.applyTitle}>
              Have a promo code?
            </CustomText>
            <View style={styles.codeRow}>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={setCode}
                placeholder="Enter code"
                placeholderTextColor={TEXT_SECONDARY}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.applyBtn, applying && { opacity: 0.5 }]}
                onPress={handleApplyCode}
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator color={TEXT_PRIMARY} size="small" />
                ) : (
                  <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: TEXT_PRIMARY }}>
                    Apply
                  </CustomText>
                )}
              </TouchableOpacity>
            </View>
            {appliedResult && (
              <View style={styles.appliedBanner}>
                <Ionicons name="checkmark-circle" size={RFValue(16)} color={GREEN} />
                <CustomText fontFamily="Medium" fontSize={13} style={{ color: GREEN, marginLeft: 8 }}>
                  {appliedResult.code} applied — ${appliedResult.discount.toFixed(2)} off
                </CustomText>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <CustomText fontFamily="SemiBold" fontSize={13} style={styles.sectionTitle}>
              AVAILABLE PROMOTIONS
            </CustomText>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={TEXT_SECONDARY} />
              </View>
            ) : promos.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="megaphone-outline" size={RFValue(32)} color={TEXT_SECONDARY} />
                <CustomText fontFamily="Regular" fontSize={14} style={{ color: TEXT_SECONDARY, marginTop: 12 }}>
                  No promotions available right now
                </CustomText>
              </View>
            ) : (
              promos.map((promo) => (
                <TouchableOpacity
                  key={promo._id}
                  style={styles.promoCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCode(promo.code);
                  }}
                >
                  <View style={styles.promoHeader}>
                    <View style={styles.discountBadge}>
                      <CustomText fontFamily="Bold" fontSize={14} style={{ color: TEXT_PRIMARY }}>
                        {formatDiscount(promo)}
                      </CustomText>
                    </View>
                    <CustomText fontFamily="Medium" fontSize={13} style={{ color: TEXT_SECONDARY }}>
                      Expires {formatExpiry(promo.validUntil)}
                    </CustomText>
                  </View>
                  <View style={styles.promoCodeRow}>
                    <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: TEXT_PRIMARY }}>
                      {promo.code}
                    </CustomText>
                    <Ionicons name="copy-outline" size={RFValue(16)} color={TEXT_SECONDARY} />
                  </View>
                  {promo.description && (
                    <CustomText fontFamily="Regular" fontSize={13} style={{ color: TEXT_SECONDARY, marginTop: 6 }}>
                      {promo.description}
                    </CustomText>
                  )}
                  {promo.minOrderAmount > 0 && (
                    <CustomText fontFamily="Regular" fontSize={12} style={{ color: TEXT_SECONDARY, marginTop: 4 }}>
                      Min. order: ${promo.minOrderAmount.toFixed(2)}
                    </CustomText>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: DIVIDER,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, textAlign: "center", color: TEXT_PRIMARY },
  headerSpacer: { width: 30 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  applySection: { padding: 20 },
  applyTitle: { color: TEXT_PRIMARY, marginBottom: 12 },
  codeRow: { flexDirection: "row", gap: 10 },
  codeInput: {
    flex: 1, backgroundColor: CARD_BG, color: TEXT_PRIMARY, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
  },
  applyBtn: {
    backgroundColor: ACCENT, paddingHorizontal: 24, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  appliedBanner: {
    flexDirection: "row", alignItems: "center", marginTop: 12,
    backgroundColor: "#052e16", padding: 12, borderRadius: 8,
  },
  section: { paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: { color: TEXT_SECONDARY, marginBottom: 12 },
  loadingRow: { padding: 24, alignItems: "center" },
  emptyCard: {
    backgroundColor: CARD_BG, borderRadius: 12, padding: 30,
    alignItems: "center",
  },
  promoCard: {
    backgroundColor: CARD_BG, borderRadius: 12, padding: 16, marginBottom: 12,
  },
  promoHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10,
  },
  discountBadge: {
    backgroundColor: ACCENT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  promoCodeRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
});

export default PromotionsScreen;
