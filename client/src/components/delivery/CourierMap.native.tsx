import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { Colors } from '@/utils/Constants';
import { customMapStyle } from '@/utils/CustomMap';

const { height: screenHeight } = Dimensions.get('window');

interface CourierMapProps {
  restaurantLocation?: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation?: {
    latitude: number;
    longitude: number;
  };
  courierLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
  };
  showRoute?: boolean;
}

export type CourierMapRef = {
  recenter: () => void;
};

const CourierMap = forwardRef<CourierMapRef, CourierMapProps>(function CourierMap(
  {
    restaurantLocation,
    deliveryLocation,
    courierLocation,
    showRoute = false,
  },
  ref
) {
  const mapRef = useRef<MapView>(null);

  const recenter = useCallback(() => {
    const focus = courierLocation ?? deliveryLocation ?? restaurantLocation;
    if (focus && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: focus.latitude,
        longitude: focus.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [courierLocation, deliveryLocation, restaurantLocation]);

  useImperativeHandle(ref, () => ({ recenter }), [recenter]);

  useEffect(() => {
    if (!courierLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: courierLocation.latitude,
      longitude: courierLocation.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    });
  }, [courierLocation?.latitude, courierLocation?.longitude]);

  const allLocations = [
    restaurantLocation,
    deliveryLocation,
    courierLocation,
  ].filter(Boolean) as Array<{ latitude: number; longitude: number }>;

  const routeCoordinates: Array<{ latitude: number; longitude: number }> = [];
  if (showRoute && courierLocation && deliveryLocation) {
    routeCoordinates.push(
      { latitude: courierLocation.latitude, longitude: courierLocation.longitude },
      { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
    );
  } else if (showRoute && restaurantLocation && courierLocation) {
    routeCoordinates.push(
      { latitude: restaurantLocation.latitude, longitude: restaurantLocation.longitude },
      { latitude: courierLocation.latitude, longitude: courierLocation.longitude }
    );
  }

  if (allLocations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Ionicons name="map-outline" size={RFValue(40)} color={Colors.textLight} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={customMapStyle}
        initialRegion={{
          latitude: courierLocation?.latitude ?? deliveryLocation?.latitude ?? allLocations[0].latitude,
          longitude: courierLocation?.longitude ?? deliveryLocation?.longitude ?? allLocations[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {restaurantLocation && (
          <Marker coordinate={restaurantLocation} title="Restaurant">
            <View style={styles.restaurantMarker}>
              <Ionicons name="restaurant" size={RFValue(20)} color={Colors.white} />
            </View>
          </Marker>
        )}
        {deliveryLocation && (
          <Marker coordinate={deliveryLocation} title="Delivery Address">
            <View style={styles.deliveryMarker}>
              <Ionicons name="home" size={RFValue(20)} color={Colors.white} />
            </View>
          </Marker>
        )}
        {courierLocation && (
          <Marker
            coordinate={courierLocation}
            title="Courier"
            rotation={courierLocation.heading ?? 0}
          >
            <View style={styles.courierMarker}>
              <Ionicons name="bicycle" size={RFValue(24)} color={Colors.white} />
            </View>
          </Marker>
        )}
        {routeCoordinates.length >= 2 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: screenHeight * 0.4,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  restaurantMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courierMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CourierMap;
