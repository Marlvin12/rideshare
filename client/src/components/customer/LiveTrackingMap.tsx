import { View, Image, TouchableOpacity } from "react-native";
import React, { FC, memo, useEffect, useRef, useState } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import { customMapStyle, defaultInitialRegion } from "@/utils/CustomMap";
import { Colors } from "@/utils/Constants";
import { getPoints, getRouteInfo } from "@/utils/mapUtils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { mapStyles } from "@/styles/mapStyles";

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

const LiveTrackingMap: FC<{
  height: number;
  drop: any;
  pickup: any;
  rider: any;
  status: string;
}> = ({ drop, status, height, pickup, rider }) => {
  const mapRef = useRef<MapView>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([]);

  const destination = status === "START" ? pickup : drop;

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
    if (!rider?.latitude || !destination?.latitude) return;
    let cancelled = false;
    (async () => {
      const route = await getRouteInfo(
        { latitude: rider.latitude, longitude: rider.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
        "DRIVE"
      );
      if (cancelled) return;
      setRoutePolyline(
        route?.encodedPolyline ? decodePolyline(route.encodedPolyline) : []
      );
      fitToMarkers();
    })();
    return () => { cancelled = true; };
  }, [rider?.latitude, rider?.longitude, status]);

  useEffect(() => {
    if (pickup?.latitude && drop?.latitude) fitToMarkers();
  }, [drop?.latitude, pickup?.latitude, rider?.latitude]);

  return (
    <View style={{ height, width: "100%" }}>
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

export default memo(LiveTrackingMap);
