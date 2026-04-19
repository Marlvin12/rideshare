import React from 'react';
import { View, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import CustomText from '@/components/shared/CustomText';
import { Colors } from '@/utils/Constants';

export interface MenuItemForRow {
  _id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

interface MenuItemRowProps {
  item: MenuItemForRow;
  onToggleAvailability: (itemId: string, isAvailable: boolean) => void;
  isUpdating?: boolean;
}

const MenuItemRow: React.FC<MenuItemRowProps> = ({
  item,
  onToggleAvailability,
  isUpdating = false,
}) => (
  <View style={[styles.row, !item.isAvailable && styles.rowUnavailable]}>
    <View style={styles.info}>
      <CustomText
        fontFamily="Medium"
        fontSize={14}
        style={[styles.name, !item.isAvailable && styles.textMuted]}
        numberOfLines={1}
      >
        {item.name}
      </CustomText>
      <CustomText fontFamily="Regular" fontSize={12} style={styles.price}>
        ${item.price.toFixed(2)}
        {item.category ? ` · ${item.category}` : ''}
      </CustomText>
    </View>
    <Switch
      value={item.isAvailable}
      onValueChange={(value) => onToggleAvailability(item._id, value)}
      disabled={isUpdating}
      trackColor={{ false: Colors.border, true: Colors.primaryLight }}
      thumbColor={Colors.white}
    />
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowUnavailable: {
    backgroundColor: Colors.background,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    color: Colors.text,
    marginBottom: 2,
  },
  textMuted: {
    color: Colors.textLight,
  },
  price: {
    color: Colors.textLight,
  },
});

export default MenuItemRow;
