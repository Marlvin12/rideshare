import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
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

const LEGAL_DOCS = [
  {
    id: "terms",
    title: "Terms of Service",
    icon: "document-text" as const,
    content: `Last updated: April 2026\n\nWelcome to Loko. By using our services, you agree to these Terms of Service.\n\n1. ACCEPTANCE OF TERMS\nBy accessing or using the Loko platform, including our mobile applications and website, you agree to be bound by these Terms of Service and our Privacy Policy.\n\n2. SERVICES\nLoko provides a technology platform that connects customers with restaurants and delivery couriers. We facilitate food ordering and delivery services but are not a food provider or delivery company.\n\n3. USER ACCOUNTS\nYou must register for an account to use our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.\n\n4. ORDERING AND PAYMENT\nAll prices displayed are in local currency. You agree to pay all charges incurred through your account. Payment is processed at the time of order placement.\n\n5. DELIVERY\nDelivery times are estimates and may vary. Loko is not liable for delays caused by factors beyond our control including traffic, weather, or restaurant preparation times.\n\n6. CANCELLATIONS AND REFUNDS\nOrders may be cancelled before the restaurant begins preparation. Refund policies vary by situation and are handled on a case-by-case basis.\n\n7. USER CONDUCT\nYou agree not to misuse the platform, engage in fraudulent activity, or harass other users, couriers, or restaurant staff.\n\n8. LIMITATION OF LIABILITY\nLoko provides services on an "as is" basis. We are not liable for indirect, incidental, or consequential damages arising from your use of the platform.\n\n9. CHANGES TO TERMS\nWe may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.\n\n10. CONTACT\nFor questions about these terms, contact us at legal@loko.co.zw`,
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    icon: "lock-closed" as const,
    content: `Last updated: April 2026\n\nLoko respects your privacy. This policy explains how we collect, use, and protect your personal information.\n\n1. INFORMATION WE COLLECT\n- Account information: name, email, phone number\n- Location data: delivery addresses and real-time location during active orders\n- Order history and preferences\n- Device information and app usage data\n\n2. HOW WE USE YOUR INFORMATION\n- To process and deliver your orders\n- To communicate with you about your orders and account\n- To improve our services and user experience\n- To ensure safety and security on our platform\n- To send promotional offers (with your consent)\n\n3. INFORMATION SHARING\nWe share your information with:\n- Restaurants to fulfill your orders\n- Delivery couriers for order delivery\n- Payment processors for transaction processing\n- Service providers who assist our operations\n\nWe do not sell your personal information to third parties.\n\n4. DATA SECURITY\nWe implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, or destruction.\n\n5. YOUR RIGHTS\nYou have the right to:\n- Access your personal data\n- Correct inaccurate data\n- Request deletion of your data\n- Opt out of marketing communications\n\n6. DATA RETENTION\nWe retain your data for as long as your account is active or as needed to provide services. You may request account deletion at any time.\n\n7. CONTACT\nFor privacy-related inquiries, contact us at privacy@loko.co.zw`,
  },
  {
    id: "community",
    title: "Community Guidelines",
    icon: "people" as const,
    content: `Last updated: April 2026\n\nLoko is built on mutual respect. These guidelines apply to all users of our platform.\n\n1. RESPECT OTHERS\nTreat everyone with dignity and respect — customers, couriers, restaurant staff, and support agents. Harassment, discrimination, or abusive behavior will not be tolerated.\n\n2. SAFETY FIRST\n- Couriers must follow traffic laws and ride safely\n- Customers should provide accurate delivery addresses\n- Report any safety concerns immediately through the app\n\n3. HONEST COMMUNICATION\n- Provide accurate information in your profile and orders\n- Rate your experience honestly and fairly\n- Do not make fraudulent claims or chargebacks\n\n4. FOOD SAFETY\n- Restaurants must follow food safety regulations\n- Couriers must handle food with care during delivery\n- Customers should inspect orders upon delivery\n\n5. ACCOUNT INTEGRITY\n- One account per person\n- Do not share your account credentials\n- Do not create fake accounts or reviews\n\n6. CONSEQUENCES\nViolations of these guidelines may result in warnings, temporary suspension, or permanent removal from the platform.\n\n7. REPORTING\nIf you witness a violation of these guidelines, report it through the app or contact support@loko.co.zw`,
  },
  {
    id: "licenses",
    title: "Open Source Licenses",
    icon: "code-slash" as const,
    content: `This application uses the following open source software:\n\nReact Native - MIT License\nCopyright (c) Meta Platforms, Inc.\n\nExpo - MIT License\nCopyright (c) 2015-present 650 Industries, Inc.\n\nReact Navigation - MIT License\nCopyright (c) 2017 React Navigation Contributors\n\n@expo/vector-icons - MIT License\nCopyright (c) 2015 Joel Arvidsson\n\nreact-native-maps - MIT License\nCopyright (c) 2017 Airbnb\n\nreact-native-responsive-fontsize - MIT License\n\nreact-native-safe-area-context - MIT License\nCopyright (c) 2019 Th3rd Wave\n\nAxios - MIT License\nCopyright (c) 2014-present Matt Zabriskie\n\nZustand - MIT License\nCopyright (c) 2019 Paul Henschel\n\nSocket.IO Client - MIT License\nCopyright (c) 2014 Guillermo Rauch\n\nAll MIT License:\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.\n\nFull license texts are available at the respective project repositories.`,
  },
];

const LegalScreen = () => {
  const [selectedDoc, setSelectedDoc] = useState<typeof LEGAL_DOCS[0] | null>(null);

  if (selectedDoc) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor={DARK_BG} translucent={false} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedDoc(null)}>
              <Ionicons name="arrow-back" size={RFValue(22)} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <CustomText fontFamily="SemiBold" fontSize={18} style={styles.headerTitle}>
              {selectedDoc.title}
            </CustomText>
            <View style={styles.headerSpacer} />
          </View>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.docContent}>
            <CustomText fontFamily="Regular" fontSize={14} style={styles.docText}>
              {selectedDoc.content}
            </CustomText>
          </ScrollView>
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
            Legal
          </CustomText>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.sectionContent}>
              {LEGAL_DOCS.map((doc, index) => (
                <React.Fragment key={doc.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <TouchableOpacity style={styles.menuItem} onPress={() => setSelectedDoc(doc)} activeOpacity={0.7}>
                    <Ionicons name={doc.icon} size={RFValue(20)} color={TEXT_PRIMARY} />
                    <CustomText fontFamily="Medium" fontSize={16} style={styles.menuTitle}>
                      {doc.title}
                    </CustomText>
                    <Ionicons name="chevron-forward" size={RFValue(18)} color={TEXT_SECONDARY} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
          <View style={styles.footer}>
            <CustomText fontFamily="Regular" fontSize={12} style={styles.footerText}>
              Loko Technologies (Pvt) Ltd
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={12} style={styles.footerText}>
              Harare, Zimbabwe
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
  scrollContent: { paddingTop: 24, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionContent: { backgroundColor: CARD_BG },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  menuTitle: { flex: 1, color: TEXT_PRIMARY },
  divider: { height: 0.5, backgroundColor: DIVIDER, marginLeft: 54 },
  docContent: { padding: 20, paddingBottom: 40 },
  docText: { color: TEXT_SECONDARY, lineHeight: 22 },
  footer: { alignItems: "center", paddingVertical: 24 },
  footerText: { color: TEXT_SECONDARY, marginTop: 4 },
});

export default LegalScreen;
