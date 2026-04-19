import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';
import { CustomizationGroup } from '@/utils/types';
import CustomizationOption from './CustomizationOption';

interface CustomizationSectionProps {
  group: CustomizationGroup;
  onOptionToggle: (groupId: string, optionId: string) => void;
}

const CustomizationSection: React.FC<CustomizationSectionProps> = ({
  group,
  onOptionToggle,
}) => {
  const { colors } = useThemeStore();

  const subtitle = group.required
    ? `Required • Select ${group.minSelection || 1}`
    : `Optional • Select up to ${group.maxSelection || 'unlimited'}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomText fontFamily="Bold" fontSize={18} style={{ color: colors.text }}>
          {group.name}
        </CustomText>
        <CustomText fontFamily="Regular" fontSize={13} style={{ color: colors.textSecondary, marginTop: 4 }}>
          {subtitle}
        </CustomText>
      </View>

      <View style={styles.options}>
        {group.options.map((option) => (
          <CustomizationOption
            key={option._id}
            option={option}
            required={group.required}
            selected={option.selected || false}
            onToggle={() => onOptionToggle(group._id, option._id)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 12,
  },
  options: {
    gap: 0,
  },
});

export default CustomizationSection;
