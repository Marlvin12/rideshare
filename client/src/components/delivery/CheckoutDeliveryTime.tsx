import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

export type DeliveryTimeMode = 'standard' | 'scheduled';

interface CheckoutDeliveryTimeProps {
  mode: DeliveryTimeMode;
  onModeChange: (mode: DeliveryTimeMode) => void;
  estimatedTime?: string;
}

const CheckoutDeliveryTime: React.FC<CheckoutDeliveryTimeProps> = ({
  mode,
  onModeChange,
  estimatedTime = '16-21 min',
}) => {
  const { colors } = useThemeStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={RFValue(18)} color={Colors.primary} />
        <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text, marginLeft: 8 }}>
          Delivery Time
        </CustomText>
      </View>

      <View style={styles.options}>
        <TouchableOpacity
          style={[
            styles.option,
            { backgroundColor: colors.card, borderColor: mode === 'standard' ? colors.text : colors.divider },
            mode === 'standard' && { borderWidth: 2 },
          ]}
          onPress={() => onModeChange('standard')}
        >
          <View style={styles.optionContent}>
            <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text }}>
              Standard
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
              {estimatedTime}
            </CustomText>
          </View>
          {mode === 'standard' && (
            <Ionicons name="checkmark-circle" size={RFValue(20)} color={Colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            { backgroundColor: colors.card, borderColor: mode === 'scheduled' ? colors.text : colors.divider },
            mode === 'scheduled' && { borderWidth: 2 },
          ]}
          onPress={() => onModeChange('scheduled')}
        >
          <View style={styles.optionContent}>
            <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text }}>
              Schedule Ahead
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
              Choose a time
            </CustomText>
          </View>
          {mode === 'scheduled' && (
            <Ionicons name="checkmark-circle" size={RFValue(20)} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  options: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionContent: {
    flex: 1,
  },
});

export default CheckoutDeliveryTime;
