import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "@/components/shared/CustomText";
import { appAxios } from "@/service/apiInterceptors";
import { logout } from "@/service/authService";
import { useWS } from "@/service/WSProvider";

const DARK_BG = "#000000";
const CARD_BG = "#1C1C1E";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#8E8E93";
const DIVIDER = "#2C2C2E";
const ACCENT = "#ac1d17";

const DataPrivacyScreen = () => {
  const { disconnect } = useWS();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    Alert.alert(
      "Request Data Export",
      "We will compile your data and send it to your registered email. This may take up to 48 hours.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Export",
          onPress: async () => {
            setExporting(true);
            try {
              await appAxios.post("/customer/me", {
                preferences: { dataExportRequestedAt: new Date().toISOString() },
              });
              Alert.alert("Requested", "Your data export has been requested. You will receive an email.");
            } catch {
              Alert.alert("Error", "Failed to request data export. Try again later.");
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you sure?",
              "Please confirm that you want to permanently delete your Loko account.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete",
                  style: "destructive",
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      await appAxios.patch("/customer/me", {
                        preferences: { deletionRequestedAt: new Date().toISOString() },
                      });
                      Alert.alert("Account Deletion Requested", "Your account will be deleted within 30 days. You will be signed out now.");
                      logout(disconnect);
                    } catch {
                      Alert.alert("Error", "Failed to request account deletion. Contact support.");
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
            Data & Privacy
          </CustomText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <CustomText fontFamily="SemiBold" fontSize={13} style={styles.sectionTitle}>
              YOUR DATA
            </CustomText>
            <View style={styles.sectionContent}>
              <TouchableOpacity style={styles.menuItem} onPress={handleExport} disabled={exporting} activeOpacity={0.7}>
                <View style={[styles.iconBox, { backgroundColor: "#1E3A5F" }]}>
                  <Ionicons name="download" size={RFValue(20)} color="#60A5FA" />
                </View>
                <View style={styles.menuContent}>
                  <CustomText fontFamily="Medium" fontSize={16} style={styles.menuTitle}>Request Data Export</CustomText>
                  <CustomText fontFamily="Regular" fontSize={13} style={styles.menuSubtitle}>Download a copy of your data</CustomText>
                </View>
                {exporting ? <ActivityIndicator color={TEXT_SECONDARY} /> : <Ionicons name="chevron-forward" size={RFValue(18)} color={TEXT_SECONDARY} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <CustomText fontFamily="SemiBold" fontSize={13} style={styles.sectionTitle}>
              DANGER ZONE
            </CustomText>
            <View style={styles.sectionContent}>
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete} disabled={deleting} activeOpacity={0.7}>
                <View style={[styles.iconBox, { backgroundColor: "#450A0A" }]}>
                  <Ionicons name="trash" size={RFValue(20)} color="#EF4444" />
                </View>
                <View style={styles.menuContent}>
                  <CustomText fontFamily="Medium" fontSize={16} style={[styles.menuTitle, { color: "#EF4444" }]}>Delete Account</CustomText>
                  <CustomText fontFamily="Regular" fontSize={13} style={styles.menuSubtitle}>Permanently remove your account and data</CustomText>
                </View>
                {deleting ? <ActivityIndicator color="#EF4444" /> : <Ionicons name="chevron-forward" size={RFValue(18)} color={TEXT_SECONDARY} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={RFValue(20)} color={TEXT_SECONDARY} />
            <CustomText fontFamily="Regular" fontSize={13} style={styles.infoText}>
              Data exports are sent to your registered email within 48 hours. Account deletions are processed within 30 days and cannot be reversed.
            </CustomText>
          </View>
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
  scrollContent: { paddingTop: 24, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionTitle: { color: TEXT_SECONDARY, paddingHorizontal: 20, marginBottom: 8 },
  sectionContent: { backgroundColor: CARD_BG },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 14 },
  menuContent: { flex: 1 },
  menuTitle: { color: TEXT_PRIMARY },
  menuSubtitle: { color: TEXT_SECONDARY, marginTop: 2 },
  infoCard: { flexDirection: "row", alignItems: "flex-start", marginHorizontal: 20, padding: 16, backgroundColor: CARD_BG, borderRadius: 12, gap: 12 },
  infoText: { color: TEXT_SECONDARY, flex: 1, lineHeight: 20 },
});

export default DataPrivacyScreen;
