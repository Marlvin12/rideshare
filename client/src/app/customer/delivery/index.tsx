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
import CategoryGrid from '@/components/delivery/CategoryGrid';
import CuisineScroller from '@/components/delivery/CuisineScroller';
import FilterPillRow from '@/components/delivery/FilterPillRow';
import PromoBannerCarousel from '@/components/delivery/PromoBannerCarousel';
import StoreListCard from '@/components/delivery/StoreListCard';
import HorizontalStoreList from '@/components/delivery/HorizontalStoreList';
import { Colors } from '@/utils/Constants';
import { getRestaurants, getCuisines } from '@/service/eatsService';
import { useDeliveryStore } from '@/store/deliveryStore';
import { DeliveryStore } from '@/utils/types';
import { useThemeStore } from '@/store/themeStore';
import { showFeatureUnavailable } from '@/utils/featureUnavailable';

const StorefrontScreen = () => {
  const { colors } = useThemeStore();
  const {
    stores,
    searchQuery,
    activeCuisine,
    filters,
    isLoading,
    setStores,
    setSearchQuery,
    setActiveCuisine,
    setFilters,
    setLoading,
  } = useDeliveryStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

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

  const handleFilterPress = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  const featuredStores = stores.filter((s) => s.featured);
  const lowFeeStores = stores.filter((s) => s.deliveryFee < 2);
  const allStores = stores;

  const renderHeader = () => (
    <View>
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
            <TouchableOpacity onPress={() => {
              // #region agent log
              fetch('http://127.0.0.1:7363/ingest/36ae7bed-9ce0-4564-9fee-11be4ad3323a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a76e12'},body:JSON.stringify({sessionId:'a76e12',runId:'initial',hypothesisId:'H2',location:'client/src/app/customer/delivery/index.tsx:103',message:'clear search tapped',data:{queryBeforeClear:searchQuery},timestamp:Date.now()})}).catch(()=>{});
              // #endregion
              setSearchQuery('');
              fetchStores();
            }}>
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

      <CategoryGrid />

      <CuisineScroller
        selectedCuisine={activeCuisine !== 'All' ? activeCuisine : undefined}
        onCuisineSelect={(id) => {
          // #region agent log
          fetch('http://127.0.0.1:7363/ingest/36ae7bed-9ce0-4564-9fee-11be4ad3323a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a76e12'},body:JSON.stringify({sessionId:'a76e12',runId:'initial',hypothesisId:'H3',location:'client/src/app/customer/delivery/index.tsx:121',message:'cuisine selected',data:{selectedId:id,activeCuisineBeforeTap:activeCuisine},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          setActiveCuisine(id === activeCuisine ? 'All' : id);
        }}
      />

      <FilterPillRow
        selectedFilters={selectedFilters}
        onFilterPress={handleFilterPress}
      />

      <PromoBannerCarousel />

      {lowFeeStores.length > 0 && (
        <HorizontalStoreList
          title="Under $2 delivery fee"
          stores={lowFeeStores}
          onStorePress={handleStorePress}
        />
      )}

      {featuredStores.length > 0 && (
        <HorizontalStoreList
          title="Featured"
          stores={featuredStores}
          onStorePress={handleStorePress}
        />
      )}

      <View style={styles.sectionHeader}>
        <CustomText fontFamily="SemiBold" fontSize={18} style={{ color: colors.text }}>
          All Stores
        </CustomText>
        {allStores.length > 0 && (
          <CustomText fontFamily="Regular" fontSize={14} style={{ color: colors.textSecondary }}>
            {allStores.length} results
          </CustomText>
        )}
      </View>
    </View>
  );

  const renderStore = ({ item }: { item: DeliveryStore }) => (
    <StoreListCard store={item} onPress={() => handleStorePress(item._id)} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.background === "#000000" ? "light" : "dark"} />
      
      <AddressHeader />

      <FlatList
        data={allStores}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
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
            <Ionicons name="restaurant-outline" size={60} color={Colors.textLight} />
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
    paddingTop: 12,
    paddingBottom: 8,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
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

export default StorefrontScreen;
