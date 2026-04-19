import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import React, { FC, memo, useEffect, useRef, useState } from "react";
import { customMapStyle, defaultInitialRegion } from "@/utils/CustomMap";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { mapStyles } from "@/styles/mapStyles";
import { getRouteInfo } from "@/utils/mapUtils";
import { Colors } from "@/utils/Constants";

interface LatLng {
  latitude: number;
  longitude: number;
}

interface RouteInfoBadgeProps {
  durationSeconds: number | null;
  distanceMeters: number | null;
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
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

const RouteInfoBadge: FC<RouteInfoBadgeProps> = ({
  durationSeconds,
  distanceMeters,
}) => {
  if (durationSeconds == null && distanceMeters == null) return null;
  return (
    <View style={styles.routeBadge}>
      {durationSeconds != null ? (
        <Text style={styles.routeBadgeTime}>
          {formatDuration(durationSeconds)}
        </Text>
      ) : null}
      {durationSeconds != null && distanceMeters != null ? (
        <Text style={styles.routeBadgeDot}> · </Text>
      ) : null}
      {distanceMeters != null ? (
        <Text style={styles.routeBadgeDist}>
          {formatDistance(distanceMeters)}
        </Text>
      ) : null}
    </View>
  );
};

const RoutesMap: FC<{ drop: LatLng; pickup: LatLng }> = ({ drop, pickup }) => {
  const mapRef = useRef<MapView>(null);
  const [polyline, setPolyline] = useState<LatLng[]>([]);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const fitToMarkers = () => {
    const coordinates: LatLng[] = [];
    if (pickup?.latitude && pickup?.longitude) coordinates.push(pickup);
    if (drop?.latitude && drop?.longitude) coordinates.push(drop);
    if (coordinates.length === 0) return;
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }, 400);
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
    if (!pickup?.latitude || !drop?.latitude) return;

    let cancelled = false;
    setRouteLoading(true);

    (async () => {
      const route = await getRouteInfo(pickup, drop, "DRIVE");
      if (cancelled) return;

      if (route?.encodedPolyline) {
        setPolyline(decodePolyline(route.encodedPolyline));
        setDurationSeconds(route.durationSeconds ?? null);
        setDistanceMeters(route.distanceMeters ?? null);
      } else {
        setPolyline([]);
        setDurationSeconds(null);
        setDistanceMeters(null);
      }
      setRouteLoading(false);
      fitToMarkers();
    })();

    return () => {
      cancelled = true;
    };
  }, [pickup?.latitude, pickup?.longitude, drop?.latitude, drop?.longitude]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={calculateInitialRegion()}
        provider="google"
        showsMyLocationButton={false}
        showsCompass={false}
        showsIndoors={false}
        customMapStyle={customMapStyle}
        showsUserLocation
      >
        {polyline.length >= 2 ? (
          <Polyline
            coordinates={polyline}
            strokeWidth={5}
            strokeColor="#1a73e8"
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
            coordinate={{
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={2}
          >
            <Image
              source={require("@/assets/icons/marker.png")}
              style={{ height: 30, width: 30, resizeMode: "contain" }}
            />
          </Marker>
        ) : null}
      </MapView>

      <RouteInfoBadge
        durationSeconds={durationSeconds}
        distanceMeters={distanceMeters}
      />

      {routeLoading ? (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : null}

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

const styles = StyleSheet.create({
  routeBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  routeBadgeTime: {
    color: "#fff",
    fontWeight: "700",
    fontSize: RFValue(13),
  },
  routeBadgeDot: {
    color: "rgba(255,255,255,0.55)",
    fontSize: RFValue(13),
  },
  routeBadgeDist: {
    color: "rgba(255,255,255,0.85)",
    fontSize: RFValue(12),
  },
  loadingBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 8,
  },
});

export default memo(RoutesMap);
