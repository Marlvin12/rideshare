import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
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

const BusinessProfileScreen = () => {
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [industry, setIndustry] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [useForOrders, setUseForOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await appAxios.get("/customer/business-profile");
      if (res.data.success && res.data.profile) {
        const p = res.data.profile;
        setCompanyName(p.companyName || "");
        setTaxId(p.taxId || "");
        setIndustry(p.industry || "");
        setBillingEmail(p.billingEmail || "");
        setBillingAddress(p.billingAddress || "");
        setUseForOrders(p.useForOrders || false);
        setExists(true);
      }
    } catch {
      // no profile yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!companyName.trim()) {
      Alert.alert("Required", "Company name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await appAxios.put("/customer/business-profile", {
        companyName: companyName.trim(),
        taxId: taxId.trim() || undefined,
        industry: industry.trim() || undefined,
        billingEmail: billingEmail.trim() || undefined,
        billingAddress: billingAddress.trim() || undefined,
        useForOrders,
      });
      if (res.data.success) {
        setExists(true);
        Alert.alert("Saved", "Business profile updated.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor={DARK_BG} translucent={false} />
        <SafeAreaView style={[styles.safeArea, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator color={TEXT_SECONDARY} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={DARK_BG} translucent={false} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={RFValue(22)} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <CustomText fontFamily="SemiBold" fontSize={18} style={styles.headerTitle}>
            Business Profile
          </CustomText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Ionicons name="briefcase" size={RFValue(32)} color={ACCENT} />
            </View>
            <CustomText fontFamily="Regular" fontSize={14} style={styles.heroDescription}>
              {exists ? "Manage your business account details." : "Set up a business profile to get receipts and expense tracking for your orders."}
            </CustomText>
          </View>

          <View style={styles.formSection}>
            <View style={styles.fieldGroup}>
              <CustomText fontFamily="Medium" fontSize={13} style={styles.fieldLabel}>COMPANY NAME *</CustomText>
              <TextInput style={styles.textInput} value={companyName} onChangeText={setCompanyName} placeholder="Acme Corp" placeholderTextColor={TEXT_SECONDARY} />
            </View>
            <View style={styles.fieldGroup}>
              <CustomText fontFamily="Medium" fontSize={13} style={styles.fieldLabel}>TAX ID / VAT NUMBER</CustomText>
              <TextInput style={styles.textInput} value={taxId} onChangeText={setTaxId} placeholder="Optional" placeholderTextColor={TEXT_SECONDARY} />
            </View>
            <View style={styles.fieldGroup}>
              <CustomText fontFamily="Medium" fontSize={13} style={styles.fieldLabel}>INDUSTRY</CustomText>
              <TextInput style={styles.textInput} value={industry} onChangeText={setIndustry} placeholder="Technology, Retail, etc." placeholderTextColor={TEXT_SECONDARY} />
            </View>
            <View style={styles.fieldGroup}>
              <CustomText fontFamily="Medium" fontSize={13} style={styles.fieldLabel}>BILLING EMAIL</CustomText>
              <TextInput style={styles.textInput} value={billingEmail} onChangeText={setBillingEmail} placeholder="billing@company.com" placeholderTextColor={TEXT_SECONDARY} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.fieldGroup}>
              <CustomText fontFamily="Medium" fontSize={13} style={styles.fieldLabel}>BILLING ADDRESS</CustomText>
              <TextInput style={[styles.textInput, { minHeight: 60 }]} value={billingAddress} onChangeText={setBillingAddress} placeholder="Full billing address" placeholderTextColor={TEXT_SECONDARY} multiline />
            </View>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <CustomText fontFamily="Medium" fontSize={15} style={{ color: TEXT_PRIMARY }}>Use for orders</CustomText>
                <CustomText fontFamily="Regular" fontSize={13} style={{ color: TEXT_SECONDARY, marginTop: 2 }}>Apply business billing to future orders</CustomText>
              </View>
              <Switch value={useForOrders} onValueChange={setUseForOrders} trackColor={{ false: "#39393D", true: ACCENT }} thumbColor={TEXT_PRIMARY} />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={TEXT_PRIMARY} /> : (
              <CustomText fontFamily="SemiBold" fontSize={16} style={styles.saveButtonText}>
                {exists ? "Save Changes" : "Create Business Profile"}
              </CustomText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },
  safeArea: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: DIVIDER },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, textAlign: "center", color: TEXT_PRIMARY },
  headerSpacer: { width: 30 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  heroSection: { alignItems: "center", paddingVertical: 30, paddingHorizontal: 20 },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#3d1513", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  heroDescription: { color: TEXT_SECONDARY, textAlign: "center", lineHeight: 20 },
  formSection: { paddingHorizontal: 20 },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { color: TEXT_SECONDARY, marginBottom: 8 },
  textInput: { backgroundColor: CARD_BG, color: TEXT_PRIMARY, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  toggleRow: { flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: 10, padding: 16, marginBottom: 18 },
  saveButton: { backgroundColor: ACCENT, marginHorizontal: 20, marginTop: 10, paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  saveButtonText: { color: TEXT_PRIMARY },
});

export default BusinessProfileScreen;
