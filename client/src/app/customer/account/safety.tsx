import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Share,
  Linking,
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
import { useUserStore } from "@/store/userStore";

const DARK_BG = "#000000";
const CARD_BG = "#1C1C1E";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#8E8E93";
const DIVIDER = "#2C2C2E";
const ACCENT = "#ac1d17";

interface TrustedContact {
  _id: string;
  name: string;
  phone: string;
  relation?: string;
}

const SafetyScreen = () => {
  const { user } = useUserStore();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await appAxios.get("/customer/safety/contacts");
      if (res.data.success) {
        setContacts(res.data.contacts);
      }
    } catch {
      // silent fail on load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAddContact = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert("Required", "Name and phone are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await appAxios.post("/customer/safety/contacts", {
        name: newName.trim(),
        phone: newPhone.trim(),
        relation: newRelation.trim() || undefined,
      });
      if (res.data.success) {
        setContacts((prev) => [res.data.contact, ...prev]);
        setShowAddForm(false);
        setNewName("");
        setNewPhone("");
        setNewRelation("");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.msg || "Failed to add contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = (contact: TrustedContact) => {
    Alert.alert("Remove contact", `Remove ${contact.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await appAxios.delete(`/customer/safety/contacts/${contact._id}`);
            setContacts((prev) => prev.filter((c) => c._id !== contact._id));
          } catch {
            Alert.alert("Error", "Failed to remove contact");
          }
        },
      },
    ]);
  };

  const handleEmergency = () => {
    Alert.alert("Emergency call", "Call emergency services (999)?", [
      { text: "Cancel", style: "cancel" },
      { text: "Call 999", style: "destructive", onPress: () => Linking.openURL("tel:999") },
    ]);
  };

  const handleShareTrip = async () => {
    try {
      await Share.share({
        message: `Track my Loko trip: https://loko.co.zw/track/${user?._id || "live"}`,
      });
    } catch {
      // user cancelled
    }
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
            Safety
          </CustomText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Ionicons name="shield-checkmark" size={RFValue(40)} color={ACCENT} />
            </View>
            <CustomText fontFamily="SemiBold" fontSize={22} style={styles.heroTitle}>
              Your safety matters
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={15} style={styles.heroDescription}>
              Tools and contacts to keep you safe on every trip.
            </CustomText>
          </View>

          <View style={styles.section}>
            <CustomText fontFamily="SemiBold" fontSize={13} style={styles.sectionTitle}>
              QUICK ACTIONS
            </CustomText>
            <View style={styles.sectionContent}>
              <TouchableOpacity style={styles.featureItem} onPress={handleEmergency} activeOpacity={0.7}>
                <View style={[styles.featureIcon, { backgroundColor: "#422006" }]}>
                  <Ionicons name="warning" size={RFValue(20)} color="#FBBF24" />
                </View>
                <View style={styles.featureContent}>
                  <CustomText fontFamily="Medium" fontSize={16} style={styles.featureTitle}>Emergency Button</CustomText>
                  <CustomText fontFamily="Regular" fontSize={13} style={styles.featureDescription}>Call emergency services immediately</CustomText>
                </View>
                <Ionicons name="chevron-forward" size={RFValue(18)} color={TEXT_SECONDARY} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.featureItem} onPress={handleShareTrip} activeOpacity={0.7}>
                <View style={[styles.featureIcon, { backgroundColor: "#3d1513" }]}>
                  <Ionicons name="location" size={RFValue(20)} color={ACCENT} />
                </View>
                <View style={styles.featureContent}>
                  <CustomText fontFamily="Medium" fontSize={16} style={styles.featureTitle}>Share Trip Status</CustomText>
                  <CustomText fontFamily="Regular" fontSize={13} style={styles.featureDescription}>Let others follow your trip in real-time</CustomText>
                </View>
                <Ionicons name="chevron-forward" size={RFValue(18)} color={TEXT_SECONDARY} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.featureItem} onPress={() => router.push("/customer/liveride")} activeOpacity={0.7}>
                <View style={[styles.featureIcon, { backgroundColor: "#2E1065" }]}>
                  <Ionicons name="checkmark-circle" size={RFValue(20)} color="#A78BFA" />
                </View>
                <View style={styles.featureContent}>
                  <CustomText fontFamily="Medium" fontSize={16} style={styles.featureTitle}>Verify Your Ride</CustomText>
                  <CustomText fontFamily="Regular" fontSize={13} style={styles.featureDescription}>Match car, plate, and driver photo</CustomText>
                </View>
                <Ionicons name="chevron-forward" size={RFValue(18)} color={TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CustomText fontFamily="SemiBold" fontSize={13} style={styles.sectionTitle}>
                TRUSTED CONTACTS
              </CustomText>
              {!showAddForm && contacts.length < 5 && (
                <TouchableOpacity onPress={() => setShowAddForm(true)}>
                  <Ionicons name="add-circle" size={RFValue(22)} color={ACCENT} />
                </TouchableOpacity>
              )}
            </View>

            {showAddForm && (
              <View style={styles.addForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor={TEXT_SECONDARY}
                  value={newName}
                  onChangeText={setNewName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone number"
                  placeholderTextColor={TEXT_SECONDARY}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Relation (optional)"
                  placeholderTextColor={TEXT_SECONDARY}
                  value={newRelation}
                  onChangeText={setNewRelation}
                />
                <View style={styles.addFormButtons}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddForm(false)}>
                    <CustomText fontFamily="Medium" fontSize={14} style={{ color: TEXT_SECONDARY }}>Cancel</CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddContact} disabled={saving}>
                    <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: TEXT_PRIMARY }}>
                      {saving ? "Saving..." : "Add Contact"}
                    </CustomText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.sectionContent}>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={TEXT_SECONDARY} />
                </View>
              ) : contacts.length === 0 ? (
                <View style={styles.emptyRow}>
                  <CustomText fontFamily="Regular" fontSize={14} style={{ color: TEXT_SECONDARY }}>
                    No trusted contacts yet. Add someone you trust.
                  </CustomText>
                </View>
              ) : (
                contacts.map((contact, index) => (
                  <React.Fragment key={contact._id}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.contactRow}>
                      <View style={[styles.featureIcon, { backgroundColor: "#1E3A5F" }]}>
                        <Ionicons name="person" size={RFValue(18)} color="#60A5FA" />
                      </View>
                      <View style={styles.featureContent}>
                        <CustomText fontFamily="Medium" fontSize={16} style={styles.featureTitle}>
                          {contact.name}
                        </CustomText>
                        <CustomText fontFamily="Regular" fontSize={13} style={styles.featureDescription}>
                          {contact.phone}{contact.relation ? ` \u00b7 ${contact.relation}` : ""}
                        </CustomText>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteContact(contact)}>
                        <Ionicons name="trash-outline" size={RFValue(18)} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </React.Fragment>
                ))
              )}
            </View>
          </View>

          <View style={styles.emergencyBanner}>
            <View style={styles.emergencyIcon}>
              <Ionicons name="call" size={RFValue(20)} color="#EF4444" />
            </View>
            <View style={styles.emergencyContent}>
              <CustomText fontFamily="SemiBold" fontSize={15} style={styles.emergencyTitle}>Emergency: 999</CustomText>
              <CustomText fontFamily="Regular" fontSize={13} style={styles.emergencyDescription}>In case of emergency, call local services</CustomText>
            </View>
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
  scrollContent: { paddingBottom: 40 },
  heroSection: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  heroIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#3d1513", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  heroTitle: { color: TEXT_PRIMARY, marginBottom: 8 },
  heroDescription: { color: TEXT_SECONDARY, textAlign: "center", lineHeight: 22 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 8 },
  sectionTitle: { color: TEXT_SECONDARY },
  sectionContent: { backgroundColor: CARD_BG },
  featureItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 14 },
  featureContent: { flex: 1 },
  featureTitle: { color: TEXT_PRIMARY },
  featureDescription: { color: TEXT_SECONDARY, marginTop: 2 },
  divider: { height: 0.5, backgroundColor: DIVIDER, marginLeft: 78 },
  contactRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20 },
  addForm: { backgroundColor: CARD_BG, marginHorizontal: 20, borderRadius: 12, padding: 16, marginBottom: 12 },
  input: { backgroundColor: DARK_BG, color: TEXT_PRIMARY, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, fontSize: 15 },
  addFormButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 4 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  saveBtn: { backgroundColor: ACCENT, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  loadingRow: { padding: 24, alignItems: "center" },
  emptyRow: { padding: 20 },
  emergencyBanner: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, padding: 16, backgroundColor: "#450A0A", borderRadius: 12 },
  emergencyIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#7F1D1D", justifyContent: "center", alignItems: "center", marginRight: 14 },
  emergencyContent: { flex: 1 },
  emergencyTitle: { color: "#FCA5A5" },
  emergencyDescription: { color: "#FCA5A5", opacity: 0.8, marginTop: 2 },
});

export default SafetyScreen;
