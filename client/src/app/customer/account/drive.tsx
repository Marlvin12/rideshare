import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "@/components/shared/CustomText";

const DARK_BG = "#000000";
const CARD_BG = "#1C1C1E";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#8E8E93";
const DIVIDER = "#2C2C2E";
const ACCENT = "#ac1d17";

const BENEFITS = [
  {
    icon: "time" as const,
    title: "Flexible schedule",
    description: "Work when you want. Go online and offline on your own terms.",
  },
  {
    icon: "cash" as const,
    title: "Competitive earnings",
    description: "Earn per delivery with weekly payouts directly to your account.",
  },
  {
    icon: "shield-checkmark" as const,
    title: "Insurance coverage",
    description: "Accident and liability coverage while you are on active deliveries.",
  },
  {
    icon: "trending-up" as const,
    title: "Performance bonuses",
    description: "Earn extra during peak hours and hit milestones for bonus payouts.",
  },
];

const REQUIREMENTS = [
  "Be at least 18 years of age",
  "Own a bicycle, scooter, or car",
  "Have a valid government-issued ID",
  "Own a smartphone (iOS or Android)",
  "Pass a background verification check",
  "Have the right to work in your country",
];

const DriveScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={DARK_BG} translucent={false} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={RFValue(22)} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <CustomText fontFamily="SemiBold" fontSize={18} style={styles.headerTitle}>
            Drive or deliver with Loko
          </CustomText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Ionicons name="car-sport" size={RFValue(40)} color={ACCENT} />
            </View>
            <CustomText fontFamily="SemiBold" fontSize={22} style={styles.heroTitle}>
              Earn on your own time
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={15} style={styles.heroDescription}>
              Join thousands of couriers delivering across Zimbabwe with Loko.
            </CustomText>
          </View>

          <View style={styles.section}>
            <CustomText fontFamily="SemiBold" fontSize={13} style={styles.sectionTitle}>
              WHY DELIVER WITH LOKO
            </CustomText>
            <View style={styles.sectionContent}>
              {BENEFITS.map((benefit, index) => (
                <React.Fragment key={benefit.title}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.benefitItem}>
                    <View style={styles.benefitIcon}>
                      <Ionicons name={benefit.icon} size={RFValue(20)} color={ACCENT} />
                    </View>
                    <View style={styles.benefitContent}>
                      <CustomText fontFamily="Medium" fontSize={16} style={styles.benefitTitle}>
                        {benefit.title}
                      </CustomText>
                      <CustomText fontFamily="Regular" fontSize={13} style={styles.benefitDescription}>
                        {benefit.description}
                      </CustomText>
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <CustomText fontFamily="SemiBold" fontSize={13} style={styles.sectionTitle}>
              REQUIREMENTS
            </CustomText>
            <View style={styles.sectionContent}>
              {REQUIREMENTS.map((req, index) => (
                <React.Fragment key={req}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle" size={RFValue(18)} color="#34D399" />
                    <CustomText fontFamily="Regular" fontSize={14} style={styles.requirementText}>
                      {req}
                    </CustomText>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.8}
            onPress={() => router.push("/rider/kyc-verification")}
          >
            <CustomText fontFamily="SemiBold" fontSize={16} style={styles.ctaButtonText}>
              Continue to verification
            </CustomText>
            <Ionicons name="arrow-forward" size={RFValue(18)} color={TEXT_PRIMARY} />
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
  heroSection: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3d1513",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: { color: TEXT_PRIMARY, marginBottom: 8 },
  heroDescription: { color: TEXT_SECONDARY, textAlign: "center", lineHeight: 22 },
  section: { marginBottom: 32 },
  sectionTitle: { color: TEXT_SECONDARY, paddingHorizontal: 20, marginBottom: 8 },
  sectionContent: { backgroundColor: CARD_BG },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3d1513",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  benefitContent: { flex: 1 },
  benefitTitle: { color: TEXT_PRIMARY },
  benefitDescription: { color: TEXT_SECONDARY, marginTop: 2 },
  divider: { height: 0.5, backgroundColor: DIVIDER, marginLeft: 78 },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  requirementText: { color: TEXT_PRIMARY, flex: 1 },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: { color: TEXT_PRIMARY },
});

export default DriveScreen;
