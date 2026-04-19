import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

interface Cuisine {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const cuisines: Cuisine[] = [
  { id: 'mexican', name: 'Mexican', icon: 'restaurant-outline' },
  { id: 'fast-food', name: 'Fast Food', icon: 'fast-food-outline' },
  { id: 'breakfast', name: 'Breakfast', icon: 'cafe-outline' },
  { id: 'pizza', name: 'Pizza', icon: 'pizza-outline' },
  { id: 'soup', name: 'Soup', icon: 'nutrition-outline' },
  { id: 'burgers', name: 'Burgers', icon: 'fast-food-outline' },
  { id: 'chinese', name: 'Chinese', icon: 'restaurant-outline' },
  { id: 'italian', name: 'Italian', icon: 'restaurant-outline' },
];

interface CuisineScrollerProps {
  selectedCuisine?: string;
  onCuisineSelect?: (cuisineId: string) => void;
}

const CuisineScroller: React.FC<CuisineScrollerProps> = ({
  selectedCuisine,
  onCuisineSelect,
}) => {
  const { colors } = useThemeStore();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {cuisines.map((cuisine) => {
        const isSelected = selectedCuisine === cuisine.id;
        return (
          <TouchableOpacity
            key={cuisine.id}
            style={styles.cuisineCard}
            onPress={() => onCuisineSelect?.(cuisine.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isSelected && { backgroundColor: colors.accent }]}>
              <Ionicons
                name={cuisine.icon}
                size={RFValue(20)}
                color={isSelected ? Colors.white : colors.text}
              />
            </View>
            <CustomText
              fontFamily={isSelected ? 'SemiBold' : 'Regular'}
              fontSize={11}
              style={[
                styles.cuisineName,
                { color: isSelected ? colors.text : colors.textSecondary },
              ]}
            >
              {cuisine.name}
            </CustomText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  cuisineCard: {
    alignItems: 'center',
    marginRight: 12,
    width: 70,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  cuisineName: {
    textAlign: 'center',
  },
});

export default CuisineScroller;
