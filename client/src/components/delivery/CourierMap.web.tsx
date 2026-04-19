import React, { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

interface CourierMapProps {
  restaurantLocation?: { latitude: number; longitude: number };
  deliveryLocation?: { latitude: number; longitude: number };
  courierLocation?: { latitude: number; longitude: number; heading?: number };
  showRoute?: boolean;
}

export type CourierMapRef = { recenter: () => void };

const CourierMap = forwardRef<CourierMapRef, CourierMapProps>(function CourierMap(_, ref) {
  const { colors } = useThemeStore();
  useImperativeHandle(ref, () => ({ recenter: () => {} }), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Ionicons name="map-outline" size={RFValue(40)} color={Colors.textLight} />
      <CustomText
        fontFamily="Regular"
        fontSize={14}
        style={{ color: colors.textSecondary, marginTop: 12 }}
      >
        Live map available on the mobile app
      </CustomText>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CourierMap;
