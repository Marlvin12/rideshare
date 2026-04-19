import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

export interface CountryOption {
  code: string;
  dialCode: string;
  name: string;
}

const COMMON_COUNTRIES: CountryOption[] = [
  { code: 'US', dialCode: '+1', name: 'United States' },
  { code: 'CA', dialCode: '+1', name: 'Canada' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom' },
  { code: 'MX', dialCode: '+52', name: 'Mexico' },
  { code: 'AU', dialCode: '+61', name: 'Australia' },
  { code: 'DE', dialCode: '+49', name: 'Germany' },
  { code: 'FR', dialCode: '+33', name: 'France' },
  { code: 'IN', dialCode: '+91', name: 'India' },
  { code: 'BR', dialCode: '+55', name: 'Brazil' },
  { code: 'ES', dialCode: '+34', name: 'Spain' },
  { code: 'IT', dialCode: '+39', name: 'Italy' },
  { code: 'JP', dialCode: '+81', name: 'Japan' },
  { code: 'CN', dialCode: '+86', name: 'China' },
  { code: 'NG', dialCode: '+234', name: 'Nigeria' },
  { code: 'KE', dialCode: '+254', name: 'Kenya' },
];

interface CountryCodePickerProps {
  visible: boolean;
  selected: CountryOption | null;
  onSelect: (country: CountryOption) => void;
  onClose: () => void;
}

export default function CountryCodePicker({
  visible,
  selected,
  onSelect,
  onClose,
}: CountryCodePickerProps) {
  const { colors } = useThemeStore();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? COMMON_COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dialCode.includes(search)
      )
    : COMMON_COUNTRIES;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.handle} />
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text }}>
              Select country
            </CustomText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={RFValue(24)} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Search country or code"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const isSelected = selected?.code === item.code;
              return (
                <TouchableOpacity
                  style={[styles.row, { backgroundColor: colors.background }, isSelected && styles.rowSelected]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <CustomText fontFamily="Medium" fontSize={16} style={{ color: colors.text }}>
                    {item.name}
                  </CustomText>
                  <View style={styles.rowRight}>
                    <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
                      {item.dialCode}
                    </CustomText>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={RFValue(20)} color={Colors.primary} style={styles.check} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 8,
  },
  searchInput: {
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  rowSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  check: {
    marginLeft: 8,
  },
});
