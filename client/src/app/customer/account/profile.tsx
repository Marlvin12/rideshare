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
import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "@/components/shared/CustomText";
import { useUserStore } from "@/store/userStore";
import { appAxios } from "@/service/apiInterceptors";

const DARK_BG = "#000000";
const CARD_BG = "#1C1C1E";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#8E8E93";
const DIVIDER = "#2C2C2E";
const ACCENT = "#ac1d17";

const ProfileScreen = () => {
  const { user, setUser } = useUserStore();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || "");
  const [gender, setGender] = useState<string>(user?.gender || "");
  const [residencyType, setResidencyType] = useState<string>(user?.residencyType || "");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasChanges =
    name !== (user?.name || "") ||
    email !== (user?.email || "") ||
    whatsapp !== (user?.whatsapp || "") ||
    gender !== (user?.gender || "") ||
    residencyType !== (user?.residencyType || "");

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await appAxios.patch("/customer/me", {
        name: name.trim(),
        email: email.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        gender: gender || undefined,
        residencyType: residencyType || undefined,
      });
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        Alert.alert("Saved", "Your profile has been updated.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const SelectRow = ({
    label,
    value,
    options,
    onSelect,
  }: {
    label: string;
    value: string;
    options: { key: string; label: string }[];
    onSelect: (v: string) => void;
  }) => (
    <View style={styles.fieldGroup}>
      <CustomText fontFamily="Medium" fontSize={13} style={styles.fieldLabel}>
        {label}
      </CustomText>
      <View style={styles.selectRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.selectChip, value === opt.key && styles.selectChipActive]}
            onPress={() => onSelect(opt.key)}
          >
            <CustomText
              fontFamily={value === opt.key ? "SemiBold" : "Regular"}
              fontSize={13}
              style={{ color: value === opt.key ? TEXT_PRIMARY : TEXT_SECONDARY }}
            >
              {opt.label}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={DARK_BG} translucent={false} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={RFValue(22)} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <CustomText fontFamily="SemiBold" fontSize={18} style={styles.headerTitle}>
            Manage Account
          </CustomText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={RFValue(36)} color={TEXT_SECONDARY} />
            </View>
            <CustomText fontFamily="SemiBold" fontSize={20} style={styles.userName}>
              {user?.name || "Guest"}
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={14} style={styles.userPhone}>
              {user?.phone || ""}
            </CustomText>
          </View>

          <View style={styles.formSection}>
            <View style={styles.fieldGroup}>
              <CustomText fontFamily="Medium" fontSize={13} style={styles.fieldLabel}>
                FULL NAME
              </CustomText>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={TEXT_SECONDARY}
              />
            </View>

            <View style={styles.fieldGroup}>
              <CustomText fontFamily="Medium" fontSize={13} style={styles.fieldLabel}>
                EMAIL
              </CustomText>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={TEXT_SECONDARY}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <CustomText fontFamily="Medium" fontSize={13} style={styles.fieldLabel}>
                WHATSAPP
              </CustomText>
              <TextInput
                style={styles.textInput}
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="+263 77 123 4567"
                placeholderTextColor={TEXT_SECONDARY}
                keyboardType="phone-pad"
              />
            </View>

            <SelectRow
              label="GENDER"
              value={gender}
              options={[
                { key: "male", label: "Male" },
                { key: "female", label: "Female" },
              ]}
              onSelect={setGender}
            />

            <SelectRow
              label="RESIDENCY"
              value={residencyType}
              options={[
                { key: "resident", label: "Resident" },
                { key: "visitor", label: "Visitor" },
              ]}
              onSelect={setResidencyType}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator color={TEXT_PRIMARY} />
            ) : (
              <CustomText fontFamily="SemiBold" fontSize={16} style={styles.saveButtonText}>
                Save Changes
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: DIVIDER,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, textAlign: "center", color: TEXT_PRIMARY },
  headerSpacer: { width: 30 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  avatarSection: { alignItems: "center", paddingVertical: 30 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: CARD_BG,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  userName: { color: TEXT_PRIMARY, marginBottom: 4 },
  userPhone: { color: TEXT_SECONDARY },
  formSection: { paddingHorizontal: 20 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { color: TEXT_SECONDARY, marginBottom: 8 },
  textInput: {
    backgroundColor: CARD_BG,
    color: TEXT_PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  selectRow: { flexDirection: "row", gap: 10 },
  selectChip: {
    flex: 1,
    backgroundColor: CARD_BG,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectChipActive: { borderColor: ACCENT },
  saveButton: {
    backgroundColor: ACCENT,
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: TEXT_PRIMARY },
});

export default ProfileScreen;
