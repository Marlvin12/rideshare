import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@/components/shared/CustomText';
import AddressHeader from '@/components/delivery/AddressHeader';
import StoreListCard from '@/components/delivery/StoreListCard';
import CuisineScroller from '@/components/delivery/CuisineScroller';
import { Colors } from '@/utils/Constants';
import { getRestaurants } from '@/service/eatsService';
import { useDeliveryStore } from '@/store/deliveryStore';
import { DeliveryStore } from '@/utils/types';
import { useThemeStore } from '@/store/themeStore';
import { showFeatureUnavailable } from '@/utils/featureUnavailable';

const BrowseScreen = () => {
  const { colors } = useThemeStore();
  const {
    stores,
    searchQuery,
    activeCuisine,
    isLoading,
    setStores,
    setSearchQuery,
    setActiveCuisine,
    setLoading,
  } = useDeliveryStore();

  const [refreshing, setRefreshing] = useState(false);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    const result = await getRestaurants({
      cuisine: activeCuisine !== 'All' ? activeCuisine : undefined,
      search: searchQuery || undefined,
    });
    if (result.success) {
      setStores(result.restaurants as DeliveryStore[]);
    }
    setLoading(false);
  }, [activeCuisine, searchQuery]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStores();
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
            placeholder="Search restaurants"
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchStores}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchStores(); }}>
              <Ionicons name="close-circle" size={RFValue(18)} color={Colors.textLight} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() =>
                showFeatureUnavailable('Map view', 'Browsing stores on a map is not available yet.')
              }
            >
              <Ionicons name="map-outline" size={RFValue(18)} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <CuisineScroller
        selectedCuisine={activeCuisine !== 'All' ? activeCuisine : undefined}
        onCuisineSelect={(id) => {
          setActiveCuisine(id === activeCuisine ? 'All' : id);
        }}
      />

      <View style={styles.resultsHeader}>
        <CustomText fontFamily="SemiBold" fontSize={16} style={{ color: colors.text }}>
          {stores.length} results
        </CustomText>
        <TouchableOpacity
          onPress={() => {
            setSearchQuery('');
            setActiveCuisine('All');
          }}
        >
          <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
            Reset
          </CustomText>
        </TouchableOpacity>
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
            <Ionicons name="search-outline" size={60} color={Colors.textLight} />
            <CustomText fontFamily="Medium" fontSize={16} style={{ color: colors.text, marginTop: 16 }}>
              No restaurants found
            </CustomText>
            <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary, marginTop: 4 }}>
              Try adjusting your filters
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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

export default BrowseScreen;
