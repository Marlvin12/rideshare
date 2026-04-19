import { View, TouchableOpacity, Image, Linking, Platform, Alert } from "react-native";
import React, { FC, memo, useEffect, useRef, useState } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import { customMapStyle, defaultInitialRegion } from "@/utils/CustomMap";
import CustomText from "../shared/CustomText";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { mapStyles } from "@/styles/mapStyles";
import { getPoints, getRouteInfo } from "@/utils/mapUtils";

const COLORS = {
  iosColor: "#007AFF",
  text: "#000000",
};

interface LatLng {
  latitude: number;
  longitude: number;
}

function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

const RiderLiveTracking: FC<{
  drop: any;
  pickup: any;
  rider: any;
  status: string;
}> = ({ drop, status, pickup, rider }) => {
  const mapRef = useRef<MapView>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([]);

  const routeOrigin = status === "START" ? pickup : rider;
  const routeDestination = status === "START" ? rider : drop;

  const fitToMarkers = () => {
    if (isUserInteracting) return;
    const coordinates: LatLng[] = [];
    if (pickup?.latitude && status === "START") {
      coordinates.push({ latitude: pickup.latitude, longitude: pickup.longitude });
    }
    if (drop?.latitude && status === "ARRIVED") {
      coordinates.push({ latitude: drop.latitude, longitude: drop.longitude });
    }
    if (rider?.latitude) {
      coordinates.push({ latitude: rider.latitude, longitude: rider.longitude });
    }
    if (coordinates.length === 0) return;
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  const calculateInitialRegion = () => {
    if (pickup?.latitude && drop?.latitude) {
      return {
        latitude: (pickup.latitude + drop.latitude) / 2,
        longitude: (pickup.longitude + drop.longitude) / 2,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return defaultInitialRegion;
  };

  useEffect(() => {
    if (!routeOrigin?.latitude || !routeDestination?.latitude) return;
    let cancelled = false;
    (async () => {
      const route = await getRouteInfo(
        { latitude: routeOrigin.latitude, longitude: routeOrigin.longitude },
        { latitude: routeDestination.latitude, longitude: routeDestination.longitude },
        "DRIVE"
      );
      if (cancelled) return;
      setRoutePolyline(
        route?.encodedPolyline ? decodePolyline(route.encodedPolyline) : []
      );
      setTimeout(fitToMarkers, 500);
    })();
    return () => { cancelled = true; };
  }, [rider?.latitude, rider?.longitude, status]);

  useEffect(() => {
    if (pickup?.latitude && drop?.latitude) fitToMarkers();
  }, [drop?.latitude, pickup?.latitude, rider?.latitude]);

  const openExternalNavigation = () => {
    const dest =
      status === "ARRIVED" && drop?.latitude != null
        ? { latitude: drop.latitude, longitude: drop.longitude }
        : pickup?.latitude != null
          ? { latitude: pickup.latitude, longitude: pickup.longitude }
          : rider?.latitude != null
            ? { latitude: rider.latitude, longitude: rider.longitude }
            : null;

    if (!dest) {
      Alert.alert("Navigation", "Location is not available yet.");
      return;
    }
    const { latitude, longitude } = dest;
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`
        : `google.navigation:q=${latitude},${longitude}`;
    Linking.canOpenURL(url)
      .then((supported) =>
        supported
          ? Linking.openURL(url)
          : Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
            )
      )
      .catch(() => Alert.alert("Navigation", "Could not open maps app."));
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        followsUserLocation
        style={{ flex: 1 }}
        initialRegion={calculateInitialRegion()}
        provider="google"
        showsMyLocationButton={false}
        showsCompass={false}
        showsIndoors={false}
        customMapStyle={customMapStyle}
        showsUserLocation
        onRegionChange={() => setIsUserInteracting(true)}
        onRegionChangeComplete={() => setIsUserInteracting(false)}
      >
        {routePolyline.length >= 2 ? (
          <Polyline
            coordinates={routePolyline}
            strokeColor="#1a73e8"
            strokeWidth={5}
          />
        ) : null}

        {drop && pickup ? (
          <Polyline
            coordinates={getPoints([drop, pickup])}
            strokeColor="#93c5fd"
            strokeWidth={2}
            geodesic
            lineDashPattern={[12, 10]}
          />
        ) : null}

        {drop?.latitude ? (
          <Marker
            coordinate={{ latitude: drop.latitude, longitude: drop.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={1}
          >
            <Image
              source={require("@/assets/icons/drop_marker.png")}
              style={{ height: 30, width: 30, resizeMode: "contain" }}
            />
          </Marker>
        ) : null}

        {pickup?.latitude ? (
          <Marker
            coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={2}
          >
            <Image
              source={require("@/assets/icons/marker.png")}
              style={{ height: 30, width: 30, resizeMode: "contain" }}
            />
          </Marker>
        ) : null}

        {rider?.latitude ? (
          <Marker
            coordinate={{ latitude: rider.latitude, longitude: rider.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={3}
          >
            <View style={{ transform: [{ rotate: `${rider?.heading ?? 0}deg` }] }}>
              <Image
                source={require("@/assets/icons/cab_marker.png")}
                style={{ height: 40, width: 40, resizeMode: "contain" }}
              />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <TouchableOpacity style={mapStyles.gpsLiveButton} onPress={openExternalNavigation}>
        <CustomText fontFamily="SemiBold" fontSize={10}>
          Open Live GPS
        </CustomText>
        <FontAwesome6 name="location-arrow" size={RFValue(12)} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity style={mapStyles.gpsButton} onPress={fitToMarkers}>
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={RFValue(16)}
          color="#3C75BE"
        />
      </TouchableOpacity>
    </View>
  );
};

export default memo(RiderLiveTracking);
