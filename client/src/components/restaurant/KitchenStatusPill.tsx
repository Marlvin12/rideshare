import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomText from '@/components/shared/CustomText';
import { Colors } from '@/utils/Constants';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'New', bg: '#FEF3C7', text: '#92400E' },
  restaurant_accepted: { label: 'Accepted', bg: '#DBEAFE', text: '#1E40AF' },
  preparing: { label: 'Preparing', bg: '#DBEAFE', text: '#1E40AF' },
  ready_for_pickup: { label: 'Ready', bg: '#FEE2E2', text: '#7f1d1d' },
  courier_searching: { label: 'Finding courier', bg: '#E0E7FF', text: '#3730A3' },
  courier_assigned: { label: 'Courier assigned', bg: '#E0E7FF', text: '#3730A3' },
  picked_up: { label: 'Picked up', bg: '#E0E7FF', text: '#3730A3' },
  in_transit: { label: 'In transit', bg: '#E0E7FF', text: '#3730A3' },
  delivered: { label: 'Delivered', bg: '#FEE2E2', text: '#7f1d1d' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#991B1B' },
};

interface KitchenStatusPillProps {
  status: string;
}

const KitchenStatusPill: React.FC<KitchenStatusPillProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: Colors.background,
    text: Colors.textLight,
  };

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <CustomText
        fontFamily="SemiBold"
        fontSize={11}
        style={[styles.text, { color: config.text }]}
      >
        {config.label}
      </CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {},
});

export default KitchenStatusPill;
