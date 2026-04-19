import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { CustomizationOption as CustomizationOptionType } from '@/utils/types';
import { useThemeStore } from '@/store/themeStore';

interface CustomizationOptionProps {
  option: CustomizationOptionType;
  required: boolean;
  selected: boolean;
  onToggle: () => void;
}

const CustomizationOptionComponent: React.FC<CustomizationOptionProps> = ({
  option,
  required,
  selected,
  onToggle,
}) => {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.divider }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        {required ? (
          <View style={[styles.radio, selected && { backgroundColor: colors.text, borderColor: colors.text }]}>
            {selected && (
              <View style={styles.radioInner} />
            )}
          </View>
        ) : (
          <View style={[styles.checkbox, selected && { backgroundColor: colors.text, borderColor: colors.text }]}>
            {selected && (
              <Ionicons name="checkmark" size={RFValue(14)} color={Colors.white} />
            )}
          </View>
        )}

        <View style={styles.textContent}>
          <View style={styles.nameRow}>
            <CustomText fontFamily="Medium" fontSize={14} style={{ color: colors.text }}>
              {option.name}
            </CustomText>
            {option.calories !== undefined && (
              <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginLeft: 8 }}>
                ({option.calories} Cals)
              </CustomText>
            )}
          </View>
          {option.price > 0 && (
            <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.text, marginTop: 2 }}>
              +${option.price.toFixed(2)}
            </CustomText>
          )}
        </View>
      </View>

      {option.imageUrl && (
        <Image source={{ uri: option.imageUrl }} style={styles.optionImage} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});

export default CustomizationOptionComponent;
