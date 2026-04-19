import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import React, { FC, memo, useCallback, useEffect, useRef, useState } from "react";
import MapView, { Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserStore } from "@/store/userStore";
import {
  getLatLong,
  getPlacesSuggestions,
  reverseGeocode,
} from "@/utils/mapUtils";
import LocationItem from "./LocationItem";
import * as Location from "expo-location";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { customMapStyle } from "@/utils/CustomMap";
import { mapStyles } from "@/styles/mapStyles";
import { Colors } from "@/utils/Constants";

const STREET_DELTA = 0.005;
const GEOCODE_DEBOUNCE_MS = 450;

function isValidCoord(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function regionAt(lat: number, lng: number): Region {
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: STREET_DELTA,
    longitudeDelta: STREET_DELTA,
  };
}

interface MapPickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  selectedLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onSelectLocation: (location: {
    type: string;
    latitude: number | undefined;
    longitude: number | undefined;
    address: string;
  }) => void;
}

const MapPickerModal: FC<MapPickerModalProps> = ({
  visible,
  selectedLocation,
  onClose,
  title,
  onSelectLocation,
}) => {
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const { location: storeLocation } = useUserStore();
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState<Region | null>(null);
  const [locations, setLocations] = useState([]);
  const textInputRef = useRef<TextInput>(null);
  const [mapReady, setMapReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<
    null | "permission" | "gps"
  >(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const cancelledRef = useRef(false);
  const geocodeRequestIdRef = useRef(0);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLocation = useCallback(async (query: string) => {
    if (query?.trim().length >= 2) {
      const data = await getPlacesSuggestions(query);
      setLocations(data);
    } else {
      setLocations([]);
    }
  }, []);

  const runReverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    const requestId = ++geocodeRequestIdRef.current;
    setIsGeocoding(true);
    const addr = await reverseGeocode(latitude, longitude);
    if (cancelledRef.current || requestId !== geocodeRequestIdRef.current) return;
    if (addr) {
      setAddress(addr);
    }
    setIsGeocoding(false);
  }, []);

  const scheduleReverseGeocode = useCallback((latitude: number, longitude: number) => {
    if (geocodeTimerRef.current) {
      clearTimeout(geocodeTimerRef.current);
    }
    geocodeTimerRef.current = setTimeout(() => {
      runReverseGeocode(latitude, longitude);
    }, GEOCODE_DEBOUNCE_MS);
  }, [runReverseGeocode]);

  useEffect(() => {
    if (!visible) {
      if (geocodeTimerRef.current) {
        clearTimeout(geocodeTimerRef.current);
        geocodeTimerRef.current = null;
      }
      geocodeRequestIdRef.current += 1;
      setText("");
      setLocations([]);
      setMapReady(false);
      setBootstrapError(null);
      setRegion(null);
      setAddress("");
      setIsGeocoding(false);
      return;
    }

    cancelledRef.current = false;
    setBootstrapError(null);
    setMapReady(false);
    setRegion(null);
    setAddress("");

    (async () => {
      const selLat = selectedLocation?.latitude;
      const selLng = selectedLocation?.longitude;

      if (isValidCoord(selLat, selLng)) {
        const r = regionAt(selLat, selLng);
        setRegion(r);
        setMapReady(true);
        const existing = selectedLocation?.address?.trim();
        if (existing) {
          setAddress(existing);
        setIsGeocoding(false);
          return;
        }
      await runReverseGeocode(selLat, selLng);
        return;
      }

      if (
        isValidCoord(storeLocation?.latitude, storeLocation?.longitude)
      ) {
        const r = regionAt(storeLocation.latitude, storeLocation.longitude);
        setRegion(r);
        setMapReady(true);
        const addr =
          storeLocation.address?.trim() ||
          (await reverseGeocode(storeLocation.latitude, storeLocation.longitude));
        if (!cancelledRef.current) {
          setAddress(addr ?? "");
          setIsGeocoding(false);
        }
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!cancelledRef.current) setBootstrapError("permission");
        return;
      }

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = pos.coords;
        if (!isValidCoord(latitude, longitude)) {
          if (!cancelledRef.current) setBootstrapError("gps");
          return;
        }
        const r = regionAt(latitude, longitude);
        setRegion(r);
        setMapReady(true);
        await runReverseGeocode(latitude, longitude);
      } catch {
        if (!cancelledRef.current) setBootstrapError("gps");
      }
    })();

    return () => {
      cancelledRef.current = true;
      if (geocodeTimerRef.current) {
        clearTimeout(geocodeTimerRef.current);
        geocodeTimerRef.current = null;
      }
    };
  }, [visible, selectedLocation, storeLocation, runReverseGeocode]);

  const addLocation = async (placeId: string) => {
    try {
      const data = await getLatLong(placeId);
      if (!data || !isValidCoord(data.latitude, data.longitude)) return;
      setBootstrapError(null);
      Keyboard.dismiss();
      textInputRef.current?.blur();
      setText("");
      setLocations([]);
      const r = regionAt(data.latitude, data.longitude);
      setRegion(r);
      setAddress(data.address || "");
      mapRef.current?.animateToRegion(r, 350);
    } catch {
      Alert.alert("Search", "Could not load that place. Try another.");
    }
  };

  const handleRegionChangeComplete = useCallback(async (newRegion: Region) => {
    if (!isValidCoord(newRegion.latitude, newRegion.longitude)) return;
    setRegion(newRegion);
    scheduleReverseGeocode(newRegion.latitude, newRegion.longitude);
  }, [scheduleReverseGeocode]);

  const handleGpsButtonPress = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location",
          "Allow location access to move the map to where you are."
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      if (!isValidCoord(latitude, longitude)) return;
      const r = regionAt(latitude, longitude);
      mapRef.current?.animateToRegion(r, 350);
      setRegion(r);
      await runReverseGeocode(latitude, longitude);
    } catch {
      Alert.alert(
        "Location unavailable",
        "Could not get your current location. Check permissions and try again."
      );
    }
  };

  const handleConfirm = () => {
    if (!region) return;
    const resolvedAddress = address.trim() || "Dropped pin";
    onSelectLocation({
      type: title,
      latitude: region.latitude,
      longitude: region.longitude,
      address: resolvedAddress,
    });
    onClose();
  };

  const titleLabel =
    title === "drop" ? "Set drop location" : "Set pickup location";

  const renderLocations = ({ item }: { item: { place_id: string } }) => (
    <LocationItem item={item} onPress={() => addLocation(item.place_id)} />
  );

  const confirmDisabled = !region;

  return (
    <Modal
      animationType="slide"
      visible={visible}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {mapReady && region ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            pitchEnabled={false}
            rotateEnabled={false}
            onRegionChangeComplete={handleRegionChangeComplete}
            provider="google"
            showsMyLocationButton={false}
            showsCompass={false}
            showsIndoors={false}
            showsIndoorLevelPicker={false}
            showsTraffic={false}
            showsScale={false}
            showsBuildings
            showsPointsOfInterest={false}
            customMapStyle={customMapStyle}
            showsUserLocation
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.loadingMap]}>
            {!bootstrapError ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : null}
          </View>
        )}

        <View
          pointerEvents="box-none"
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={RFValue(26)} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {titleLabel}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View
          style={[
            styles.searchWrap,
            { top: insets.top + 52 },
          ]}
        >
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={RFValue(18)} color="#777" />
            <TextInput
              ref={textInputRef}
              style={styles.searchInput}
              placeholder="Search address"
              placeholderTextColor="#aaa"
              value={text}
              onChangeText={(q) => {
                setText(q);
                fetchLocation(q);
              }}
              returnKeyType="search"
            />
            {text.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setText("");
                  setLocations([]);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={RFValue(20)} color="#999" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {text !== "" ? (
          <View
            style={[
              styles.suggestionsPanel,
              { top: insets.top + 52 + 52, bottom: insets.bottom + 160 },
            ]}
          >
            {text.length < 2 ? (
              <Text style={styles.suggestionsHint}>
                Enter at least 2 characters to search
              </Text>
            ) : null}
            <FlatList
              data={locations}
              renderItem={renderLocations}
              keyExtractor={(item: { place_id: string }) => item.place_id}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={8}
              windowSize={5}
            />
          </View>
        ) : null}

        {mapReady && region ? (
          <>
            <View style={mapStyles.centerMarkerContainer} pointerEvents="none">
              <Image
                source={
                  title === "drop"
                    ? require("@/assets/icons/drop_marker.png")
                    : require("@/assets/icons/marker.png")
                }
                style={mapStyles.marker}
              />
            </View>
            <TouchableOpacity
              style={[
                mapStyles.gpsButton,
                { bottom: insets.bottom + 168 },
              ]}
              onPress={handleGpsButtonPress}
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={RFValue(18)}
                color="#3C75BE"
              />
            </TouchableOpacity>
          </>
        ) : null}

        {bootstrapError ? (
          <View style={[styles.errorCard, { bottom: insets.bottom + 24 }]}>
            <Text style={styles.errorTitle}>
              {bootstrapError === "permission"
                ? "Location access needed"
                : "Could not find your position"}
            </Text>
            <Text style={styles.errorBody}>
              {bootstrapError === "permission"
                ? "Allow location to show the map near you, or search for an address."
                : "Try again or search for an address below."}
            </Text>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={() => {
                setBootstrapError(null);
                setMapReady(false);
                cancelledRef.current = false;
                (async () => {
                  const { status } =
                    await Location.requestForegroundPermissionsAsync();
                  if (status !== "granted") {
                    setBootstrapError("permission");
                    return;
                  }
                  try {
                    const pos = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.Balanced,
                    });
                    const { latitude, longitude } = pos.coords;
                    if (!isValidCoord(latitude, longitude)) {
                      setBootstrapError("gps");
                      return;
                    }
                    const r = regionAt(latitude, longitude);
                    setRegion(r);
                    setMapReady(true);
                    await runReverseGeocode(latitude, longitude);
                  } catch {
                    setBootstrapError("gps");
                  }
                })();
              }}
            >
              <Text style={styles.errorButtonText}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.errorCancel}>
              <Text style={styles.errorCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {mapReady && region && !bootstrapError ? (
          <View
            style={[
              styles.bottomCard,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.addressRow}>
              <Ionicons
                name="location-sharp"
                size={RFValue(20)}
                color={Colors.primary}
                style={styles.addressIcon}
              />
              <View style={styles.addressTextWrap}>
                {isGeocoding ? (
                  <View style={styles.geocodeRow}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.geocodeLabel}>Locating address</Text>
                  </View>
                ) : (
                  <Text style={styles.addressText} numberOfLines={3}>
                    {address.trim() || "Move the map to choose a spot"}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                confirmDisabled && styles.confirmBtnDisabled,
              ]}
              disabled={confirmDisabled}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>Confirm location</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#E8EEF4",
  },
  loadingMap: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    zIndex: 20,
  },
  headerBack: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: RFValue(15),
    fontWeight: "600",
    color: "#111",
  },
  headerSpacer: {
    width: 44,
  },
  searchWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 19,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: RFValue(15),
    height: 48,
    color: "#111",
  },
  suggestionsPanel: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  suggestionsHint: {
    padding: 14,
    fontSize: RFValue(13),
    color: "#666",
  },
  bottomCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 17,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  addressIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  addressTextWrap: {
    flex: 1,
  },
  addressText: {
    fontSize: RFValue(14),
    color: "#111",
    lineHeight: RFValue(20),
  },
  geocodeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  geocodeLabel: {
    fontSize: RFValue(14),
    color: "#555",
    marginLeft: 10,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: RFValue(16),
    fontWeight: "700",
  },
  errorCard: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    zIndex: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  errorTitle: {
    fontSize: RFValue(17),
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  errorBody: {
    fontSize: RFValue(14),
    color: "#555",
    marginBottom: 16,
    lineHeight: RFValue(20),
  },
  errorButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  errorButtonText: {
    color: "#fff",
    fontSize: RFValue(15),
    fontWeight: "700",
  },
  errorCancel: {
    paddingVertical: 8,
    alignItems: "center",
  },
  errorCancelText: {
    fontSize: RFValue(15),
    color: Colors.primary,
    fontWeight: "600",
  },
});

export default memo(MapPickerModal);
