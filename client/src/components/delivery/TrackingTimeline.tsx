import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import { useThemeStore } from '@/store/themeStore';

interface TimelineStep {
  status: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { status: 'pending', label: 'Order Placed', icon: 'receipt-outline' },
  { status: 'restaurant_accepted', label: 'Confirmed', icon: 'checkmark-circle-outline' },
  { status: 'preparing', label: 'Preparing', icon: 'restaurant-outline' },
  { status: 'ready_for_pickup', label: 'Ready', icon: 'bag-check-outline' },
  { status: 'bidding_open', label: 'Finding courier', icon: 'people-outline' },
  { status: 'courier_assigned', label: 'Courier on the way to pickup', icon: 'car-outline' },
  { status: 'picked_up', label: 'Picked Up', icon: 'bicycle-outline' },
  { status: 'in_transit', label: 'On the Way', icon: 'navigate-outline' },
  { status: 'delivered', label: 'Delivered', icon: 'home-outline' },
];

const STATUS_ORDER = [
  'pending',
  'restaurant_accepted',
  'preparing',
  'ready_for_pickup',
  'bidding_open',
  'courier_assigned',
  'picked_up',
  'in_transit',
  'delivered',
];

interface TrackingTimelineProps {
  currentStatus: string;
  estimatedArrival?: string;
}

const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  currentStatus,
  estimatedArrival,
}) => {
  const { colors } = useThemeStore();
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  const getStepState = (step: TimelineStep) => {
    const stepIndex = STATUS_ORDER.indexOf(step.status);
    
    if (currentStatus === 'cancelled') {
      return 'cancelled';
    }
    
    if (stepIndex < currentIndex) {
      return 'completed';
    }
    if (stepIndex === currentIndex) {
      return 'current';
    }
    return 'pending';
  };

  const filteredSteps = TIMELINE_STEPS.filter((step) => {
    if (currentStatus === 'cancelled') {
      return STATUS_ORDER.indexOf(step.status) <= currentIndex;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {filteredSteps.map((step, index) => {
        const state = getStepState(step);
        const isLast = index === filteredSteps.length - 1;

        return (
          <View key={step.status} style={styles.stepContainer}>
            <View style={styles.stepLeft}>
              <View
                style={[
                  styles.iconContainer,
                  state === 'completed' && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                  state === 'current' && { borderColor: Colors.primary },
                  state === 'pending' && { borderColor: colors.divider },
                  state === 'cancelled' && { borderColor: Colors.error },
                ]}
              >
                <Ionicons
                  name={state === 'completed' ? 'checkmark' : step.icon}
                  size={RFValue(14)}
                  color={
                    state === 'completed'
                      ? Colors.white
                      : state === 'current'
                      ? Colors.primary
                      : state === 'cancelled'
                      ? Colors.error
                      : colors.textSecondary
                  }
                />
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    state === 'completed' && { backgroundColor: Colors.primary },
                  ]}
                />
              )}
            </View>

            <View style={styles.stepContent}>
              <CustomText
                fontFamily={state === 'current' ? 'SemiBold' : 'Regular'}
                fontSize={14}
                style={[
                  { color: state === 'completed' ? Colors.primary : state === 'current' ? colors.text : colors.textSecondary },
                ]}
              >
                {step.label}
              </CustomText>
              
              {state === 'current' && currentStatus !== 'delivered' && estimatedArrival && (
                <CustomText fontFamily="Regular" fontSize={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
                  {estimatedArrival}
                </CustomText>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  stepContainer: {
    flexDirection: 'row',
  },
  stepLeft: {
    alignItems: 'center',
    width: 40,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  line: {
    width: 2,
    height: 30,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 30,
  },
});

export default TrackingTimeline;
