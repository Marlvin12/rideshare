import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import StoreHero from '@/components/delivery/StoreHero';
import StoreInfoBottomSheet from '@/components/delivery/StoreInfoBottomSheet';
import StickyCategoryTabs from '@/components/delivery/StickyCategoryTabs';
import MenuItemCard from '@/components/delivery/MenuItemCard';
import FloatingCartBar from '@/components/delivery/FloatingCartBar';
import { Colors } from '@/utils/Constants';
import { getRestaurantById, getRestaurantMenu } from '@/service/eatsService';
import { useDeliveryStore } from '@/store/deliveryStore';
import { useCartStore } from '@/store/cartStore';
import { DeliveryStore } from '@/utils/types';
import { useThemeStore } from '@/store/themeStore';

const StoreMenuScreen = () => {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { colors } = useThemeStore();
  const { selectedStore, setSelectedStore, setDeliveryMode, deliveryMode } = useDeliveryStore();
  const { addItem, getItemCount, restaurant: cartRestaurant, items } = useCartStore();

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStore = useCallback(async () => {
    if (!storeId) return;
    
    setIsLoading(true);
    const result = await getRestaurantById(storeId);
    if (result.success) {
      setSelectedStore(result.restaurant as DeliveryStore);
    }
    setIsLoading(false);
  }, [storeId]);

  const fetchMenu = useCallback(async () => {
    if (!storeId) return;
    
    const result = await getRestaurantMenu(storeId);
    if (result.success) {
      setMenuItems(result.menuItems);
      setCategories(result.categories);
      if (result.categories.length > 0) {
        setSelectedCategory(result.categories[0]);
      }
    }
  }, [storeId]);

  useEffect(() => {
    fetchStore();
    fetchMenu();
  }, [storeId]);

  const handleAddToCart = (item: any) => {
    if (!selectedStore) return;

    addItem(
      {
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
        imageUrl: item.imageUrl,
      },
      {
        id: selectedStore._id,
        name: selectedStore.name,
        imageUrl: selectedStore.imageUrl,
        deliveryFee: selectedStore.deliveryFee,
        minimumOrder: selectedStore.minimumOrder,
      }
    );
  };

  const getItemQuantity = (itemId: string) => {
    const item = items.find((i) => i.menuItemId === itemId);
    return item?.quantity || 0;
  };

  const handleShare = useCallback(async () => {
    if (!selectedStore) return;
    try {
      await Share.share({
        title: selectedStore.name,
        message: `Check out ${selectedStore.name} on RideShare Delivery! ${selectedStore.location?.address || ''}`.trim(),
      });
    } catch {
      // Share dialog dismissed
    }
  }, [selectedStore]);

  const handleSaveStore = useCallback(() => {
    Alert.alert('Saved', `${selectedStore?.name ?? 'Store'} has been saved to your favourites.`);
  }, [selectedStore]);

  const handleGroupOrder = useCallback(() => {
    Alert.alert('Group Orders', 'Group ordering is coming soon. You will be able to invite friends to add items to a shared cart.');
  }, []);

  const filteredMenuItems = (() => {
    const byCategory = selectedCategory
      ? menuItems.filter((item) => item.category === selectedCategory)
      : menuItems;
    if (!searchQuery.trim()) return byCategory;
    const q = searchQuery.trim().toLowerCase();
    return byCategory.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  })();

  if (isLoading || !selectedStore) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <CustomText fontFamily="Medium" fontSize={16}>Loading...</CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <StoreHero
        store={selectedStore}
        onBack={() => router.back()}
        onSearch={() => setShowSearch((v) => !v)}
        onFavorite={handleSaveStore}
        onMore={() => handleShare()}
      />

      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <Ionicons name="search" size={RFValue(16)} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search menu..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={RFValue(16)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        style={styles.scrollView}
      >
        <StoreInfoBottomSheet
          store={selectedStore}
          onDeliveryToggle={(mode) => setDeliveryMode(mode)}
          onGroupOrder={handleGroupOrder}
          onSaveStore={handleSaveStore}
          onShare={handleShare}
        />

        <StickyCategoryTabs
          categories={categories.map((cat) => ({ id: cat, name: cat }))}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        <View style={styles.menuSection}>
          <CustomText fontFamily="SemiBold" fontSize={18} style={[styles.menuTitle, { color: colors.text }]}>
            {selectedCategory || 'Menu'}
          </CustomText>
          
          {filteredMenuItems.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              quantity={getItemQuantity(item._id)}
              onPress={() => router.push(`/customer/delivery/product/${item._id}`)}
              onAddToCart={() => handleAddToCart(item)}
            />
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <FloatingCartBar />
    </View>
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
  scrollView: {
    flex: 1,
  },
  menuSection: {
    paddingTop: 8,
  },
  menuTitle: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: RFValue(14),
  },
});

export default StoreMenuScreen;
