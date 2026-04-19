import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useCartStore } from '@/store/cartStore';
import { router } from 'expo-router';

const FloatingCartBar: React.FC = () => {
  const {
    restaurant,
    getItemCount,
    getTotal,
  } = useCartStore();

  const itemCount = getItemCount();
  const total = getTotal();

  if (itemCount === 0 || !restaurant) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.cartButton}
        onPress={() => router.push('/customer/delivery/cart')}
        activeOpacity={0.8}
      >
        <View style={styles.leftSection}>
          <View style={styles.badge}>
            <CustomText fontFamily="SemiBold" fontSize={12} style={styles.badgeText}>
              {itemCount}
            </CustomText>
          </View>
          <View style={styles.cartInfo}>
            <CustomText fontFamily="SemiBold" fontSize={16} style={styles.cartText}>
              View Cart
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={12} style={styles.restaurantName}>
              {restaurant.name}
            </CustomText>
          </View>
        </View>
        <View style={styles.rightSection}>
          <CustomText fontFamily="Bold" fontSize={16} style={styles.totalText}>
            ${total.toFixed(2)}
          </CustomText>
          <Ionicons name="chevron-forward" size={RFValue(20)} color={Colors.white} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.white,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: Colors.primary,
  },
  cartInfo: {
    flex: 1,
  },
  cartText: {
    color: Colors.white,
  },
  restaurantName: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalText: {
    color: Colors.white,
  },
});

export default FloatingCartBar;
