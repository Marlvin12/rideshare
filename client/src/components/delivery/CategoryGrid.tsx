import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors, screenWidth } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
}

const categories: Category[] = [
  { id: 'fast-food', name: 'Fast Food', icon: 'fast-food-outline' },
  { id: 'grocery', name: 'Grocery', icon: 'basket-outline' },
  { id: 'african', name: 'African', icon: 'leaf-outline' },
  { id: 'breakfast', name: 'Breakfast', icon: 'cafe-outline' },
  { id: 'chicken', name: 'Chicken', icon: 'flame-outline' },
  { id: 'burgers', name: 'Burgers', icon: 'restaurant-outline' },
  { id: 'pizza', name: 'Pizza', icon: 'pizza-outline' },
  { id: 'offers', name: 'Offers', icon: 'pricetag-outline' },
  { id: 'seafood', name: 'Seafood', icon: 'fish-outline' },
  { id: 'soup', name: 'Sadza & More', icon: 'nutrition-outline' },
  { id: 'going-out', name: 'Going Out', icon: 'walk-outline' },
  { id: 'pharmacy', name: 'Pharmacy', icon: 'medkit-outline' },
];

const CategoryGrid: React.FC = () => {
  const { colors } = useThemeStore();
  const cardWidth = (screenWidth - 48) / 4;

  const handleCategoryPress = (category: Category) => {
    if (category.route) {
      // Handle navigation if needed
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[styles.categoryCard, { width: cardWidth }]}
          onPress={() => handleCategoryPress(category)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
            <Ionicons
              name={category.icon}
              size={RFValue(24)}
              color={colors.text}
            />
          </View>
          <CustomText
            fontFamily="Regular"
            fontSize={11}
            style={[styles.categoryName, { color: colors.text }]}
            numberOfLines={2}
          >
            {category.name}
          </CustomText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    textAlign: 'center',
  },
});

export default CategoryGrid;
