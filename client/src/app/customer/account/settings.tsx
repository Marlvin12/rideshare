import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "@/components/shared/CustomText";
import { useUserStore } from "@/store/userStore";
import { useThemeStore } from "@/store/themeStore";
import { appAxios } from "@/service/apiInterceptors";

const SettingsScreen = () => {
  const { preferences, setUser } = useUserStore();
  const { colors, mode, toggleMode } = useThemeStore();

  const [pushNotifications, setPushNotifications] = useState(
    preferences?.notifications?.push ?? true
  );
  const [emailNotifications, setEmailNotifications] = useState(
    preferences?.notifications?.email ?? true
  );
  const [smsNotifications, setSmsNotifications] = useState(
    preferences?.notifications?.sms ?? true
  );
  const [promoNotifications, setPromoNotifications] = useState(
    preferences?.notifications?.promo ?? false
  );
  const [savingPref, setSavingPref] = useState(false);

  const persistNotificationPref = useCallback(
    async (key: string, value: boolean) => {
      try {
        setSavingPref(true);
        const res = await appAxios.patch("/customer/me", {
          preferences: {
            notifications: {
              ...(preferences?.notifications || {}),
              [key]: value,
            },
          },
        });
        if (res.data.success && res.data.user) {
          setUser(res.data.user);
        }
      } catch {
        // revert on failure will happen naturally on next load
      } finally {
        setSavingPref(false);
      }
    },
    [preferences, setUser]
  );

  const handleToggle = (key: string, setter: (v: boolean) => void) => (value: boolean) => {
    setter(value);
    persistNotificationPref(key, value);
  };

  const openDeviceSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openSettings();
    } else {
      Linking.sendIntent("android.settings.SETTINGS");
    }
  };

  const openAccessibilitySettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("App-Prefs:ACCESSIBILITY");
    } else {
      Linking.sendIntent("android.settings.ACCESSIBILITY_SETTINGS");
    }
  };

  const openLocationSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openSettings();
    } else {
      Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS");
    }
  };

  const SettingToggle = ({
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <CustomText fontFamily="Medium" fontSize={16} style={dynamicStyles.settingTitle}>
          {title}
        </CustomText>
        {subtitle && (
          <CustomText fontFamily="Regular" fontSize={13} style={dynamicStyles.settingSubtitle}>
            {subtitle}
          </CustomText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: mode === "dark" ? "#39393D" : "#E5E7EB", true: colors.accent }}
        thumbColor={colors.text}
        ios_backgroundColor={mode === "dark" ? "#39393D" : "#E5E7EB"}
      />
    </View>
  );

  const MenuItem = ({
    title,
    subtitle,
    onPress,
  }: {
    title: string;
    subtitle?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuContent}>
        <CustomText fontFamily="Medium" fontSize={16} style={styles.menuTitle}>
          {title}
        </CustomText>
        {subtitle && (
          <CustomText fontFamily="Regular" fontSize={13} style={styles.menuSubtitle}>
            {subtitle}
          </CustomText>
        )}
      </View>
      <Ionicons name="chevron-forward" size={RFValue(18)} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.divider,
    },
    sectionContent: { backgroundColor: colors.card },
    settingTitle: { color: colors.text },
    settingSubtitle: { color: colors.textSecondary, marginTop: 2 },
    menuTitle: { color: colors.text },
    menuSubtitle: { color: colors.textSecondary, marginTop: 2 },
  });

  return (
    <View style={dynamicStyles.container}>
      <StatusBar
        style={colors.background === "#000000" ? "light" : "dark"}
        backgroundColor={colors.background}
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={RFValue(22)} color={colors.text} />
          </TouchableOpacity>
          <CustomText
            fontFamily="SemiBold"
            fontSize={18}
            style={[styles.headerTitle, { color: colors.text }]}
          >
            Settings
          </CustomText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <CustomText
              fontFamily="SemiBold"
              fontSize={13}
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              APPEARANCE
            </CustomText>
            <View style={dynamicStyles.sectionContent}>
              <SettingToggle
                title="Dark Mode"
                subtitle={mode === "dark" ? "Dark theme enabled" : "Light theme enabled"}
                value={mode === "dark"}
                onValueChange={(value) => {
                  if (value !== (mode === "dark")) toggleMode();
                }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <CustomText
              fontFamily="SemiBold"
              fontSize={13}
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              NOTIFICATIONS
            </CustomText>
            <View style={dynamicStyles.sectionContent}>
              <SettingToggle
                title="Push Notifications"
                subtitle="Trip updates and alerts"
                value={pushNotifications}
                onValueChange={handleToggle("push", setPushNotifications)}
              />
              <View style={styles.divider} />
              <SettingToggle
                title="Email Notifications"
                subtitle="Receipts and account updates"
                value={emailNotifications}
                onValueChange={handleToggle("email", setEmailNotifications)}
              />
              <View style={styles.divider} />
              <SettingToggle
                title="SMS Notifications"
                subtitle="Text message alerts"
                value={smsNotifications}
                onValueChange={handleToggle("sms", setSmsNotifications)}
              />
              <View style={styles.divider} />
              <SettingToggle
                title="Promotional Offers"
                subtitle="Deals and new features"
                value={promoNotifications}
                onValueChange={handleToggle("promo", setPromoNotifications)}
              />
            </View>
          </View>

          <View style={styles.section}>
            <CustomText
              fontFamily="SemiBold"
              fontSize={13}
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              DEVICE
            </CustomText>
            <View style={dynamicStyles.sectionContent}>
              <MenuItem
                title="Accessibility"
                subtitle="VoiceOver, larger text, high contrast"
                onPress={openAccessibilitySettings}
              />
              <View
                style={[styles.divider, { backgroundColor: colors.divider, marginLeft: 20 }]}
              />
              <MenuItem
                title="Location Services"
                subtitle="Manage how we use your location"
                onPress={openLocationSettings}
              />
            </View>
          </View>

          <View style={styles.section}>
            <CustomText
              fontFamily="SemiBold"
              fontSize={13}
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              PRIVACY & DATA
            </CustomText>
            <View style={dynamicStyles.sectionContent}>
              <MenuItem
                title="Data & Privacy"
                subtitle="Export or delete your data"
                onPress={() => router.push("/customer/account/data-privacy")}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, textAlign: "center" },
  headerSpacer: { width: 30 },
  content: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionTitle: { paddingHorizontal: 20, marginBottom: 8 },
  settingItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20 },
  settingInfo: { flex: 1 },
  divider: { height: 0.5, marginLeft: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20 },
  menuContent: { flex: 1 },
  menuTitle: {},
  menuSubtitle: {},
});

export default SettingsScreen;
