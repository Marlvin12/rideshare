import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import CustomizationSection from '@/components/delivery/CustomizationSection';
import { Colors } from '@/utils/Constants';
import { getRestaurantMenu } from '@/service/eatsService';
import { useCartStore } from '@/store/cartStore';
import { useDeliveryStore } from '@/store/deliveryStore';
import { formatCurrency } from '@/utils/currency';
import { MenuItemCustomization, CustomizationGroup } from '@/utils/types';
import { useThemeStore } from '@/store/themeStore';

const ProductCustomizationScreen = () => {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { colors } = useThemeStore();
  const { selectedStore } = useDeliveryStore();
  const { addItem, restaurant: cartRestaurant } = useCartStore();

  const [menuItem, setMenuItem] = useState<MenuItemCustomization | null>(null);
  const [customizations, setCustomizations] = useState<CustomizationGroup[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMenuItem = useCallback(async () => {
    if (!itemId || !selectedStore) return;
    
    setIsLoading(true);
    const result = await getRestaurantMenu(selectedStore._id);
    if (result.success) {
      const item = result.menuItems.find((i: any) => i._id === itemId);
      if (item) {
        setMenuItem({
          ...item,
          customizationGroups: item.customizations || [],
        });
        setCustomizations(item.customizations || []);
        setTotalPrice(item.price);
      }
    }
    setIsLoading(false);
  }, [itemId, selectedStore]);

  useEffect(() => {
    fetchMenuItem();
  }, [fetchMenuItem]);

  const handleOptionToggle = (groupId: string, optionId: string) => {
    setCustomizations((prev) =>
      prev.map((group) => {
        if (group._id === groupId) {
          const updatedOptions = group.options.map((opt) =>
            opt._id === optionId ? { ...opt, selected: !opt.selected } : opt
          );
          
          if (group.required) {
            updatedOptions.forEach((opt) => {
              if (opt._id !== optionId) {
                opt.selected = false;
              }
            });
          }
          
          return { ...group, options: updatedOptions };
        }
        return group;
      })
    );
  };

  useEffect(() => {
    if (menuItem) {
      let price = menuItem.basePrice;
      customizations.forEach((group) => {
        group.options.forEach((opt) => {
          if (opt.selected) {
            price += opt.price;
          }
        });
      });
      setTotalPrice(price);
    }
  }, [customizations, menuItem]);

  const handleAddToCart = () => {
    if (!menuItem || !selectedStore) return;

    const selectedCustomizations: Record<string, any> = {};
    customizations.forEach((group) => {
      const selected = group.options.filter((opt) => opt.selected);
      if (selected.length > 0) {
        selectedCustomizations[group._id] = selected.map((opt) => opt._id);
      }
    });

    addItem(
      {
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: totalPrice,
        quantity: 1,
        imageUrl: menuItem.imageUrl,
        customizations: selectedCustomizations,
      },
      {
        id: selectedStore._id,
        name: selectedStore.name,
        imageUrl: selectedStore.imageUrl,
        deliveryFee: selectedStore.deliveryFee,
        minimumOrder: selectedStore.minimumOrder,
      }
    );

    router.back();
  };

  const canAddToCart = () => {
    if (!menuItem) return false;
    return customizations.every((group) => {
      if (group.required) {
        return group.options.some((opt) => opt.selected);
      }
      return true;
    });
  };

  if (isLoading || !menuItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <CustomText fontFamily="Medium" fontSize={16}>Loading...</CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={RFValue(22)} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.textSecondary }}>
            {selectedStore?.name}
          </CustomText>
          <CustomText fontFamily="Bold" fontSize={18} style={{ color: colors.text }}>
            {menuItem.name}
          </CustomText>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {menuItem.imageUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: menuItem.imageUrl }} style={styles.image} />
          </View>
        )}

        {menuItem.description && (
          <View style={styles.descriptionContainer}>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.text }}>
              {menuItem.description}
            </CustomText>
          </View>
        )}

        <View style={styles.customizationsContainer}>
          {customizations.map((group) => (
            <CustomizationSection
              key={group._id}
              group={group}
              onOptionToggle={handleOptionToggle}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[
            styles.addButton,
            !canAddToCart() && styles.addButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={!canAddToCart()}
        >
          <CustomText fontFamily="SemiBold" fontSize={16} style={styles.addButtonText}>
            {canAddToCart() ? `Add to Cart • ${formatCurrency(totalPrice)}` : 'Make required selections'}
          </CustomText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  customizationsContainer: {
    paddingTop: 8,
  },
  footer: {
    padding: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  addButtonText: {
    color: Colors.white,
  },
});

export default ProductCustomizationScreen;
