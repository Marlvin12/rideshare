import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

export type SoldOutPreference = 'merchant_recommend' | 'refund' | 'contact_me' | 'cancel_order';

const OPTIONS: { value: SoldOutPreference; label: string; description: string }[] = [
  { value: 'merchant_recommend', label: 'Choose a replacement', description: 'Let the merchant pick a similar item' },
  { value: 'refund', label: 'Refund the item', description: 'Get refunded for the unavailable item' },
  { value: 'contact_me', label: 'Contact me', description: 'Merchant will reach out to decide' },
  { value: 'cancel_order', label: 'Cancel the entire order', description: 'Cancel and refund the full order' },
];

interface SoldOutPreferenceModalProps {
  visible: boolean;
  selected: SoldOutPreference | null;
  onSelect: (value: SoldOutPreference) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function SoldOutPreferenceModal({
  visible,
  selected,
  onSelect,
  onClose,
  onSave,
}: SoldOutPreferenceModalProps) {
  const { colors } = useThemeStore();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.handle} />
          <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text, marginBottom: 8 }}>
            If an item is unavailable
          </CustomText>
          <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary, marginBottom: 20 }}>
            We will follow your preference if the store runs out of an item.
          </CustomText>

          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionRow,
                  { backgroundColor: colors.card, borderColor: isSelected ? Colors.primary : colors.divider },
                  isSelected && { borderWidth: 2 },
                ]}
                onPress={() => onSelect(opt.value)}
              >
                <View style={styles.optionContent}>
                  <CustomText fontFamily="Medium" fontSize={15} style={{ color: colors.text }}>
                    {opt.label}
                  </CustomText>
                  <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary, marginTop: 2 }}>
                    {opt.description}
                  </CustomText>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={RFValue(22)} color={Colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.divider }]} onPress={onClose}>
              <CustomText fontFamily="Medium" fontSize={15} style={{ color: colors.text }}>
                Cancel
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: Colors.primary }]}
              onPress={onSave}
              disabled={!selected}
            >
              <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: Colors.white }}>
                Save
              </CustomText>
            </TouchableOpacity>
          </View>
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
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  optionContent: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
});
