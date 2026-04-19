import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import { Colors } from '@/utils/Constants';

interface RestaurantMetricTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
}

const RestaurantMetricTile: React.FC<RestaurantMetricTileProps> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.tile}>
    <View style={styles.iconWrap}>
      <Ionicons name={icon} size={RFValue(24)} color={Colors.primary} />
    </View>
    <CustomText fontFamily="SemiBold" fontSize={20} style={styles.value}>
      {value}
    </CustomText>
    <CustomText fontFamily="Regular" fontSize={12} style={styles.label}>
      {label}
    </CustomText>
  </View>
);

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    marginBottom: 8,
  },
  value: {
    color: Colors.text,
    marginBottom: 2,
  },
  label: {
    color: Colors.textLight,
  },
});

export default RestaurantMetricTile;
