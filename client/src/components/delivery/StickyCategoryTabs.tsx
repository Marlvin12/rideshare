import React, { useRef, useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

interface Category {
  id: string;
  name: string;
  count?: number;
}

interface StickyCategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

const StickyCategoryTabs: React.FC<StickyCategoryTabsProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
}) => {
  const { colors } = useThemeStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const [tabPositions, setTabPositions] = useState<{ [key: string]: number }>({});

  const handleTabLayout = (categoryId: string, event: LayoutChangeEvent) => {
    const { x } = event.nativeEvent.layout;
    setTabPositions((prev) => ({ ...prev, [categoryId]: x }));
  };

  const scrollToCategory = (categoryId: string) => {
    const position = tabPositions[categoryId];
    if (position !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: position - 16, animated: true });
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      scrollToCategory(selectedCategory);
    }
  }, [selectedCategory]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={styles.tab}
              onPress={() => onCategorySelect(category.id)}
              onLayout={(e) => handleTabLayout(category.id, e)}
              activeOpacity={0.7}
            >
              <CustomText
                fontFamily={isSelected ? 'SemiBold' : 'Regular'}
                fontSize={14}
                style={[
                  styles.tabText,
                  { color: isSelected ? colors.text : colors.textSecondary },
                ]}
              >
                {category.name}
              </CustomText>
              {isSelected && (
                <View style={[styles.indicator, { backgroundColor: Colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 24,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },
  tabText: {
    marginBottom: 4,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
});

export default StickyCategoryTabs;
