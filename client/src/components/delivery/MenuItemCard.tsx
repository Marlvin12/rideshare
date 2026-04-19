import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isVegetarian?: boolean;
  approvalPercentage?: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  quantity?: number;
  onPress: () => void;
  onAddToCart: () => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  quantity = 0,
  onPress,
  onAddToCart,
}) => {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity
      style={[styles.container, !item.isAvailable && styles.unavailable]}
      onPress={onPress}
      disabled={!item.isAvailable}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.textContent}>
          <View style={styles.nameRow}>
            <CustomText fontFamily="SemiBold" fontSize={15} numberOfLines={1} style={{ color: colors.text }}>
              {item.name}
            </CustomText>
            {item.isVegetarian && (
              <View style={styles.vegBadge}>
                <Ionicons name="leaf" size={RFValue(10)} color="#ac1d17" />
              </View>
            )}
          </View>

          {item.description && (
            <CustomText
              fontFamily="Regular"
              fontSize={12}
              numberOfLines={2}
              style={{ color: colors.textSecondary, marginTop: 4, marginBottom: 6 }}
            >
              {item.description}
            </CustomText>
          )}

          <View style={styles.footerRow}>
            <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: colors.text }}>
              ${item.price.toFixed(2)}
            </CustomText>
            {item.approvalPercentage && (
              <View style={styles.ratingBadge}>
                <Ionicons name="thumbs-up" size={RFValue(12)} color={Colors.text} />
                <CustomText fontFamily="Regular" fontSize={11} style={{ color: colors.text, marginLeft: 4 }}>
                  {item.approvalPercentage}%
                </CustomText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.imageSection}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Ionicons name="fast-food" size={RFValue(24)} color={Colors.textLight} />
            </View>
          )}

          {item.isAvailable && (
            <TouchableOpacity
              style={[styles.addButton, quantity > 0 && styles.addButtonActive]}
              onPress={onAddToCart}
            >
              {quantity > 0 ? (
                <View style={styles.quantityContainer}>
                  <Ionicons name="remove" size={RFValue(16)} color={Colors.white} />
                  <CustomText fontFamily="SemiBold" fontSize={14} style={styles.quantityText}>
                    {quantity}
                  </CustomText>
                  <Ionicons name="add" size={RFValue(16)} color={Colors.white} />
                </View>
              ) : (
                <Ionicons name="add" size={RFValue(18)} color={Colors.white} />
              )}
            </TouchableOpacity>
          )}

          {!item.isAvailable && (
            <View style={styles.unavailableOverlay}>
              <CustomText fontFamily="Medium" fontSize={10} style={styles.unavailableText}>
                Unavailable
              </CustomText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unavailable: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  textContent: {
    flex: 1,
    paddingRight: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vegBadge: {
    backgroundColor: '#FEE2E2',
    padding: 2,
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imageSection: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonActive: {
    width: 80,
    height: 32,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityText: {
    color: Colors.white,
    minWidth: 20,
    textAlign: 'center',
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: Colors.textLight,
  },
});

export default MenuItemCard;
