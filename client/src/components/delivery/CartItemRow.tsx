import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  customizations?: Record<string, any>;
  specialInstructions?: string;
}

interface CartItemRowProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  const { colors } = useThemeStore();
  const subtotal = item.price * item.quantity;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.info}>
            <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: colors.text }} numberOfLines={2}>
              {item.name}
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary, marginTop: 2 }}>
              ${item.price.toFixed(2)} each
            </CustomText>
            {item.specialInstructions && (
              <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' }}>
                Note: {item.specialInstructions}
              </CustomText>
            )}
          </View>
          
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Ionicons name="trash-outline" size={RFValue(16)} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
              onPress={onDecrease}
            >
              <Ionicons
                name="remove"
                size={RFValue(16)}
                color={item.quantity <= 1 ? colors.textSecondary : colors.text}
              />
            </TouchableOpacity>
            
            <CustomText fontFamily="SemiBold" fontSize={14} style={{ color: colors.text, minWidth: 30, textAlign: 'center' }}>
              {item.quantity}
            </CustomText>
            
            <TouchableOpacity style={styles.quantityButton} onPress={onIncrease}>
              <Ionicons name="add" size={RFValue(16)} color={colors.text} />
            </TouchableOpacity>
          </View>

          <CustomText fontFamily="SemiBold" fontSize={15} style={{ color: colors.text }}>
            ${subtotal.toFixed(2)}
          </CustomText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 12,
    paddingHorizontal: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
});

export default CartItemRow;
