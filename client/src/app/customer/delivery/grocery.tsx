import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import AddressHeader from '@/components/delivery/AddressHeader';
import StoreListCard from '@/components/delivery/StoreListCard';
import { Colors } from '@/utils/Constants';
import { getRestaurants } from '@/service/eatsService';
import { useDeliveryStore } from '@/store/deliveryStore';
import { DeliveryStore } from '@/utils/types';
import { useThemeStore } from '@/store/themeStore';

const GroceryScreen = () => {
  const { colors } = useThemeStore();
  const {
    stores,
    searchQuery,
    isLoading,
    setStores,
    setSearchQuery,
    setLoading,
  } = useDeliveryStore();

  const [refreshing, setRefreshing] = useState(false);

  const fetchGroceryStores = useCallback(async () => {
    setLoading(true);
    const result = await getRestaurants({
      search: searchQuery || 'grocery',
    });
    if (result.success) {
      setStores(result.restaurants as DeliveryStore[]);
    }
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    fetchGroceryStores();
  }, [fetchGroceryStores]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGroceryStores();
    setRefreshing(false);
  };

  const handleStorePress = (storeId: string) => {
    router.push(`/customer/delivery/store/${storeId}`);
  };

  const renderStore = ({ item }: { item: DeliveryStore }) => (
    <StoreListCard store={item} onPress={() => handleStorePress(item._id)} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.background === "#000000" ? "light" : "dark"} />
      
      <AddressHeader />

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={RFValue(18)} color={Colors.textLight} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search grocery"
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchGroceryStores}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchGroceryStores(); }}>
              <Ionicons name="close-circle" size={RFValue(18)} color={Colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item._id}
        renderItem={renderStore}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={60} color={Colors.textLight} />
            <CustomText fontFamily="Medium" fontSize={16} style={{ color: colors.text, marginTop: 16 }}>
              No grocery stores found
            </CustomText>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
});

export default GroceryScreen;
