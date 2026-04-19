import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SectionList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import CustomText from '@/components/shared/CustomText';
import MenuItemRow from '@/components/restaurant/MenuItemRow';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { useRestaurantStore } from '@/store/restaurantStore';
import { getRestaurantMenu } from '@/service/eatsService';
import { updateMenuItemAvailability } from '@/service/restaurantService';
import { Colors } from '@/utils/Constants';
import type { MenuItemForRow } from '@/components/restaurant/MenuItemRow';

type Section = { title: string; data: MenuItemForRow[] };

const RestaurantMenu = () => {
  const { restaurantId } = useRestaurantStore();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    if (!restaurantId) return;
    setError(null);
    const result = await getRestaurantMenu(restaurantId);
    if (result.success && result.menuItems?.length) {
      const categories = result.categories ?? [
        ...new Set((result.menuItems as MenuItemForRow[]).map((i) => i.category).filter(Boolean)),
      ];
      const list = (result.menuItems as MenuItemForRow[]).map((i) => ({
        _id: i._id,
        name: i.name,
        price: i.price,
        category: i.category ?? '',
        isAvailable: i.isAvailable !== false,
      }));
      const sectionList: Section[] = categories.length
        ? categories.map((cat: string) => ({
            title: cat,
            data: list.filter((i) => i.category === cat),
          })).filter((s: Section) => s.data.length > 0)
        : [{ title: 'Menu', data: list }];
      setSections(sectionList);
    } else if (result.success && (!result.menuItems || result.menuItems.length === 0)) {
      setSections([]);
    } else {
      setError((result as { error?: string }).error ?? 'Failed to load menu');
    }
    setIsLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMenu();
    setRefreshing(false);
  };

  const handleToggleAvailability = useCallback(
    async (itemId: string, isAvailable: boolean) => {
      if (!restaurantId) return;
      setUpdatingId(itemId);
      const result = await updateMenuItemAvailability(restaurantId, itemId, isAvailable);
      setUpdatingId(null);
      if (result.success && result.menuItem) {
        setSections((prev) =>
          prev.map((sec) => ({
            ...sec,
            data: sec.data.map((i) =>
              i._id === itemId ? { ...i, isAvailable } : i
            ),
          }))
        );
      } else {
        setError((result as { error?: string }).error ?? 'Failed to update');
      }
    },
    [restaurantId]
  );

  if (!restaurantId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" backgroundColor={Colors.white} />
        <EmptyState
          icon="restaurant-outline"
          title="No restaurant selected"
          message="Set EXPO_PUBLIC_RESTAURANT_ID in .env or select in Account."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={Colors.white} />
      <View style={styles.header}>
        <CustomText fontFamily="SemiBold" fontSize={20} style={styles.title}>
          Menu
        </CustomText>
        <CustomText fontFamily="Regular" fontSize={14} style={styles.subtitle}>
          Toggle item availability
        </CustomText>
      </View>

      {error ? (
        <ErrorState
          message={error}
          onRetry={() => { setError(null); loadMenu(); }}
        />
      ) : isLoading && sections.length === 0 ? (
        <LoadingState message="Loading menu..." fullScreen={false} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="restaurant-outline"
              title="No menu items"
              message="Add items from the admin panel or seed data."
            />
          }
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <CustomText fontFamily="SemiBold" fontSize={14} style={styles.sectionTitle}>
                {title}
              </CustomText>
            </View>
          )}
          renderItem={({ item }) => (
            <MenuItemRow
              item={item}
              onToggleAvailability={handleToggleAvailability}
              isUpdating={updatingId === item._id}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textLight,
  },
  list: {
    paddingBottom: 100,
  },
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: Colors.textLight,
  },
});

export default RestaurantMenu;
