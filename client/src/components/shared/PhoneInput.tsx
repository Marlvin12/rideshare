import { View, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView } from "react-native";
import React, { FC, useState } from "react";
import { RFValue } from "react-native-responsive-fontsize";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Localization from 'expo-localization';
import CustomText from "./CustomText";
import { Colors } from "@/utils/Constants";

interface Country {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
  maxLength: number;
}

const COUNTRIES: Country[] = [
  { name: "United States", code: "US", flag: "\u{1F1FA}\u{1F1F8}", dialCode: "+1", maxLength: 10 },
  { name: "United Kingdom", code: "GB", flag: "\u{1F1EC}\u{1F1E7}", dialCode: "+44", maxLength: 10 },
  { name: "Canada", code: "CA", flag: "\u{1F1E8}\u{1F1E6}", dialCode: "+1", maxLength: 10 },
  { name: "Australia", code: "AU", flag: "\u{1F1E6}\u{1F1FA}", dialCode: "+61", maxLength: 9 },
  { name: "Zimbabwe", code: "ZW", flag: "\u{1F1FF}\u{1F1FC}", dialCode: "+263", maxLength: 9 },
  { name: "South Africa", code: "ZA", flag: "\u{1F1FF}\u{1F1E6}", dialCode: "+27", maxLength: 9 },
  { name: "Kenya", code: "KE", flag: "\u{1F1F0}\u{1F1EA}", dialCode: "+254", maxLength: 10 },
  { name: "Nigeria", code: "NG", flag: "\u{1F1F3}\u{1F1EC}", dialCode: "+234", maxLength: 10 },
  { name: "Ghana", code: "GH", flag: "\u{1F1EC}\u{1F1ED}", dialCode: "+233", maxLength: 9 },
  { name: "India", code: "IN", flag: "\u{1F1EE}\u{1F1F3}", dialCode: "+91", maxLength: 10 },
  { name: "China", code: "CN", flag: "\u{1F1E8}\u{1F1F3}", dialCode: "+86", maxLength: 11 },
  { name: "Japan", code: "JP", flag: "\u{1F1EF}\u{1F1F5}", dialCode: "+81", maxLength: 10 },
  { name: "Germany", code: "DE", flag: "\u{1F1E9}\u{1F1EA}", dialCode: "+49", maxLength: 11 },
  { name: "France", code: "FR", flag: "\u{1F1EB}\u{1F1F7}", dialCode: "+33", maxLength: 9 },
  { name: "Brazil", code: "BR", flag: "\u{1F1E7}\u{1F1F7}", dialCode: "+55", maxLength: 11 },
  { name: "Mexico", code: "MX", flag: "\u{1F1F2}\u{1F1FD}", dialCode: "+52", maxLength: 10 },
  { name: "Spain", code: "ES", flag: "\u{1F1EA}\u{1F1F8}", dialCode: "+34", maxLength: 9 },
  { name: "Italy", code: "IT", flag: "\u{1F1EE}\u{1F1F9}", dialCode: "+39", maxLength: 10 },
];

const getDefaultCountry = (): Country => {
  try {
    const locales = Localization.getLocales();
    const deviceRegion = locales[0]?.regionCode;
    const foundCountry = COUNTRIES.find((c) => c.code === deviceRegion);
    return foundCountry || COUNTRIES[0];
  } catch {
    return COUNTRIES[0];
  }
};

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onCountryCodeChange?: (dialCode: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  accentColor?: string;
}

const PhoneInput: FC<PhoneInputProps> = ({
  value,
  onChangeText,
  onCountryCodeChange,
  onBlur,
  onFocus,
  accentColor,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    const def = getDefaultCountry();
    onCountryCodeChange?.(def.dialCode);
    return def;
  });
  const [showCountryModal, setShowCountryModal] = useState(false);

  const checkColor = accentColor || Colors.primary;

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
    onChangeText("");
    onCountryCodeChange?.(country.dialCode);
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => setShowCountryModal(true)}
        >
          <CustomText fontFamily="Regular" style={styles.flag}>
            {selectedCountry.flag}
          </CustomText>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <CustomText fontFamily="Regular" style={styles.countryCode}>
            {selectedCountry.dialCode}
          </CustomText>
          <TextInput
            placeholder="000-000-0000"
            keyboardType="phone-pad"
            value={value}
            maxLength={selectedCountry.maxLength}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholderTextColor={Colors.textLight}
            style={styles.input}
          />
        </View>
      </View>

      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowCountryModal(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <CustomText fontFamily="Bold" variant="h5" style={styles.modalTitle}>
              Select Country
            </CustomText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.countryList}>
            {COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country.code}
                style={styles.countryItem}
                onPress={() => handleCountrySelect(country)}
              >
                <View style={styles.countryInfo}>
                  <CustomText fontFamily="Regular" style={styles.countryFlag}>
                    {country.flag}
                  </CustomText>
                  <CustomText fontFamily="Regular" variant="h6" style={styles.countryName}>
                    {country.name}
                  </CustomText>
                </View>
                <CustomText fontFamily="Regular" variant="h6" style={styles.countryDialCode}>
                  {country.dialCode}
                </CustomText>
                {selectedCountry.code === country.code && (
                  <MaterialIcons name="check" size={24} color={checkColor} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    gap: 4,
  },
  flag: {
    fontSize: 24,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countryCode: {
    fontSize: RFValue(14),
    color: Colors.text,
  },
  input: {
    flex: 1,
    fontSize: RFValue(14),
    fontFamily: "Regular",
    height: 50,
    color: Colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 40,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  countryFlag: {
    fontSize: 24,
  },
  countryName: {
    fontSize: 16,
    color: Colors.text,
  },
  countryDialCode: {
    fontSize: 16,
    color: Colors.textLight,
    marginRight: 12,
  },
});

export default PhoneInput;
