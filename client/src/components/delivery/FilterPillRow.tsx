import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

interface FilterPill {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const filters: FilterPill[] = [
  { id: 'ridepass', label: 'RidePass', icon: 'checkmark-circle-outline' },
  { id: 'pickup', label: 'Pickup', icon: 'walk-outline' },
  { id: 'deals', label: 'Deals', icon: 'pricetag-outline' },
  { id: 'ratings', label: 'Ratings', icon: 'star-outline' },
  { id: 'delivery-fees', label: 'Delivery Fees', icon: 'chevron-down-outline' },
];

interface FilterPillRowProps {
  selectedFilters?: string[];
  onFilterPress?: (filterId: string) => void;
}

const FilterPillRow: React.FC<FilterPillRowProps> = ({
  selectedFilters = [],
  onFilterPress,
}) => {
  const { colors } = useThemeStore();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isSelected = selectedFilters.includes(filter.id);
        return (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.pill,
              isSelected && { backgroundColor: colors.text },
            ]}
            onPress={() => onFilterPress?.(filter.id)}
            activeOpacity={0.7}
          >
            {filter.icon && (
              <Ionicons
                name={filter.icon}
                size={RFValue(14)}
                color={isSelected ? Colors.white : colors.text}
                style={styles.icon}
              />
            )}
            <CustomText
              fontFamily={isSelected ? 'SemiBold' : 'Regular'}
              fontSize={13}
              style={[
                styles.pillText,
                { color: isSelected ? Colors.white : colors.text },
              ]}
            >
              {filter.label}
            </CustomText>
            {filter.id === 'delivery-fees' && (
              <Ionicons
                name="chevron-down"
                size={RFValue(12)}
                color={isSelected ? Colors.white : colors.textSecondary}
                style={styles.chevron}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  icon: {
    marginRight: 6,
  },
  pillText: {
    marginRight: 4,
  },
  chevron: {
    marginLeft: 4,
  },
});

export default FilterPillRow;
