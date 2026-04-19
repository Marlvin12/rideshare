import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState, useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import CustomText from "@/components/shared/CustomText";
import { resetAndNavigate } from "@/utils/Helpers";
import { updateUserProfile } from "@/service/authService";

const PRIMARY = "#B71C1C";
const DISABLED = "#D1D5DB";

const goPostProfile = (role: string, user: { kyc?: { status?: string } }) => {
  if (role === "customer") {
    resetAndNavigate("/customer/home");
    return;
  }
  const skipKyc = process.env.EXPO_PUBLIC_SKIP_KYC === "1";
  const kycStatus = user?.kyc?.status || "pending";
  if (skipKyc || kycStatus === "approved") {
    resetAndNavigate("/rider/home");
  } else {
    resetAndNavigate("/rider/kyc-verification");
  }
};

const CompleteProfile = () => {
  const { role, phone } = useLocalSearchParams<{
    role: string;
    phone: string;
  }>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState(() => (phone || "").replace(/\s/g, ""));
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [residency, setResidency] = useState<"resident" | "visitor" | null>(null);
  const [noOffers, setNoOffers] = useState(false);
  const [saving, setSaving] = useState(false);

  const namesOk = firstName.trim().length > 0 && lastName.trim().length > 0;
  const canSave = namesOk && !saving;

  const handleSkip = useCallback(() => {
    goPostProfile(role || "customer", {});
  }, [role]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const user = await updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        whatsapp: whatsapp.trim() || (phone || "").replace(/\s/g, ""),
        gender: gender || undefined,
        residencyType: residency || undefined,
        marketingOptOut: noOffers,
      });
      goPostProfile(user.role, user);
    } catch (e: any) {
      const msg =
        e?.response?.data?.msg ||
        e?.message ||
        "Could not save profile.";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CustomText fontFamily="Bold" variant="h3" style={styles.title}>
          Complete your profile
        </CustomText>
        <CustomText fontFamily="Regular" variant="h7" style={styles.subtitle}>
          Enjoy a better experience on Xigoa with a full profile.
        </CustomText>

        <CustomText fontFamily="SemiBold" variant="h7" style={styles.label}>
          First name
        </CustomText>
        <TextInput
          style={styles.input}
          placeholder="First name"
          placeholderTextColor="#9CA3AF"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />

        <CustomText fontFamily="SemiBold" variant="h7" style={styles.label}>
          Last name
        </CustomText>
        <TextInput
          style={styles.input}
          placeholder="Last name"
          placeholderTextColor="#9CA3AF"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

        <View style={styles.whatsappLabelRow}>
          <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
          <CustomText fontFamily="SemiBold" variant="h7" style={styles.labelInline}>
            WhatsApp number
          </CustomText>
        </View>
        <TextInput
          style={styles.input}
          placeholder="WhatsApp number"
          placeholderTextColor="#9CA3AF"
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
        />

        <CustomText fontFamily="SemiBold" variant="h7" style={styles.label}>
          Gender
        </CustomText>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.card, gender === "male" && styles.cardActive]}
            onPress={() => setGender("male")}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="gender-male"
              size={28}
              color="#3B82F6"
            />
            <CustomText fontFamily="Medium" variant="h7" style={styles.cardText}>
              Male
            </CustomText>
            <View
              style={[styles.radio, gender === "male" && styles.radioOn]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, gender === "female" && styles.cardActive]}
            onPress={() => setGender("female")}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="gender-female"
              size={28}
              color="#EC4899"
            />
            <CustomText fontFamily="Medium" variant="h7" style={styles.cardText}>
              Female
            </CustomText>
            <View
              style={[styles.radio, gender === "female" && styles.radioOn]}
            />
          </TouchableOpacity>
        </View>

        <CustomText fontFamily="SemiBold" variant="h7" style={styles.label}>
          Zimbabwean resident / visitor
        </CustomText>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.card, residency === "resident" && styles.cardActive]}
            onPress={() => setResidency("resident")}
            activeOpacity={0.7}
          >
            <CustomText fontFamily="Medium" variant="h7" style={styles.cardTextOnly}>
              Resident
            </CustomText>
            <View
              style={[styles.radio, residency === "resident" && styles.radioOn]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, residency === "visitor" && styles.cardActive]}
            onPress={() => setResidency("visitor")}
            activeOpacity={0.7}
          >
            <CustomText fontFamily="Medium" variant="h7" style={styles.cardTextOnly}>
              Visitor
            </CustomText>
            <View
              style={[styles.radio, residency === "visitor" && styles.radioOn]}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setNoOffers(!noOffers)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkBox, noOffers && styles.checkBoxOn]}>
            {noOffers ? (
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
            ) : null}
          </View>
          <CustomText fontFamily="Regular" variant="h7" style={styles.checkLabel}>
            Do not send messages about offers and discounts to me.
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.9}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <CustomText fontFamily="Bold" variant="h6" style={styles.saveText}>
              Save
            </CustomText>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skipWrap}>
          <CustomText fontFamily="Medium" variant="h7" style={styles.skip}>
            Skip for now
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
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    color: "#1F2937",
    fontSize: 26,
    marginBottom: 8,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  label: {
    color: "#1F2937",
    marginBottom: 8,
    marginTop: 4,
  },
  whatsappLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    marginTop: 16,
  },
  labelInline: {
    color: "#1F2937",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Regular",
    color: "#1F2937",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardActive: {
    borderColor: PRIMARY,
    borderWidth: 1.5,
  },
  cardText: {
    flex: 1,
    color: "#1F2937",
  },
  cardTextOnly: {
    flex: 1,
    color: "#1F2937",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  radioOn: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 20,
    marginBottom: 28,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkBoxOn: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  checkLabel: {
    flex: 1,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: DISABLED,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 17,
  },
  skipWrap: {
    alignItems: "center",
    marginTop: 20,
  },
  skip: {
    color: "#6B7280",
    fontSize: 15,
  },
});

export default CompleteProfile;
