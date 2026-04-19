import { View, Platform, ActivityIndicator, Alert } from "react-native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { screenHeight } from "@/utils/Constants";
import { useWS } from "@/service/WSProvider";
import { rideStyles } from "@/styles/rideStyles";
import { StatusBar } from "expo-status-bar";
import LiveTrackingMap from "@/components/customer/LiveTrackingMap";
import CustomText from "@/components/shared/CustomText";
import { SimpleBottomSheet, SimpleBottomSheetScrollView } from "@/components/shared/SimpleBottomSheet";
import SearchingRideSheet from "@/components/customer/SearchingRideSheet";
import LiveTrackingSheet from "@/components/customer/LiveTrackingSheet";
import { resetAndNavigate } from "@/utils/Helpers";
import { useLocalSearchParams } from "expo-router";
import { getLatestActiveRide, getRideById } from "@/service/rideService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const androidHeights = [screenHeight * 0.12, screenHeight * 0.42];
const iosHeights = [screenHeight * 0.2, screenHeight * 0.5];

const LiveRide = () => {
  const insets = useSafeAreaInsets();
  const { emit, on, off } = useWS();
  const [rideData, setRideData] = useState<any>(null);
  const [riderCoords, setriderCoords] = useState<any>(null);
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(
    () => (Platform.OS === "ios" ? iosHeights : androidHeights),
    []
  );

  const handleSheetChanges = useCallback((index: number) => {}, []);

  useEffect(() => {
    const hydrateRide = async () => {
      if (id) {
        const byId = await getRideById(id);
        if (byId.success && byId.ride) {
          setRideData(byId.ride);
          return;
        }
      }
      const latest = await getLatestActiveRide();
      if (latest.success && latest.ride) {
        setRideData(latest.ride);
        return;
      }
      Alert.alert("Ride Error", "Unable to load ride information.");
      resetAndNavigate("/customer/home");
    };
    hydrateRide();
  }, [id]);

  useEffect(() => {
    const subscriptionId = id || rideData?._id;
    if (!subscriptionId) return;
    emit("subscribeRide", subscriptionId);

    on("rideData", (data) => {
      if (data) {
        setRideData(data);
      }
      if (data?.status === "SEARCHING_FOR_RIDER" || data?.status === "AWAITING_OFFERS") {
        emit("searchrider", subscriptionId);
      }
    });

    on("rideUpdate", (data) => {
      setRideData(data);
    });

    on("rideCanceled", () => {
      resetAndNavigate("/customer/home");
      Alert.alert("Ride Canceled");
    });

    on("error", () => {
      resetAndNavigate("/customer/home");
      Alert.alert("Oh Dang! No Riders Found");
    });

    return () => {
      off("rideData");
      off("rideUpdate");
      off("rideCanceled");
      off("error");
    };
  }, [id, rideData?._id, emit, on, off]);

  useEffect(() => {
    if (!rideData?.rider?._id) return;
    emit("subscribeToriderLocation", rideData?.rider?._id);
    on("riderLocationUpdate", (data) => {
      setriderCoords(data?.coords);
    });

    return () => {
      off("riderLocationUpdate");
    };
  }, [rideData?.rider?._id, emit, on, off]);

  return (
    <View style={rideStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />

      {rideData && (
        <LiveTrackingMap
          height={screenHeight}
          status={rideData?.status}
          drop={{
            latitude: parseFloat(rideData?.drop?.latitude),
            longitude: parseFloat(rideData?.drop?.longitude),
          }}
          pickup={{
            latitude: parseFloat(rideData?.pickup?.latitude),
            longitude: parseFloat(rideData?.pickup?.longitude),
          }}
          rider={
            riderCoords
              ? {
                  latitude: riderCoords.latitude,
                  longitude: riderCoords.longitude,
                  heading: riderCoords.heading,
                }
              : {}
          }
        />
      )}

      {rideData ? (
        <SimpleBottomSheet
          ref={bottomSheetRef}
          initialIndex={1}
          handleIndicatorStyle={{
            backgroundColor: "#ccc",
          }}
          enableOverDrag={false}
          enableDynamicSizing={false}
          style={{ zIndex: 4 }}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          bottomInset={Platform.OS === "android" ? Math.max(insets.bottom, 20) : insets.bottom}
        >
          <SimpleBottomSheetScrollView 
            contentContainerStyle={{ 
              ...rideStyles?.container,
              paddingBottom: 20 
            }}
            showsVerticalScrollIndicator={false}
          >
            {(rideData?.status === "SEARCHING_FOR_RIDER" || rideData?.status === "AWAITING_OFFERS") ? (
              <SearchingRideSheet item={rideData} />
            ) : (
              <LiveTrackingSheet item={rideData} />
            )}
          </SimpleBottomSheetScrollView>
        </SimpleBottomSheet>
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <CustomText variant="h8">Fetching Information...</CustomText>
          <ActivityIndicator color="black" size="small" />
        </View>
      )}
    </View>
  );
};

export default memo(LiveRide);
