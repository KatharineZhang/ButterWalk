import { useState, useEffect } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { RideRequest } from "../../server/src/api";
import { NotificationType } from "./Both_Notification";
import Ionicons from "@expo/vector-icons/Ionicons";
import { styles } from "@/assets/styles";
import BothProgressBar from "../components/Both_ProgressBar";

interface HandleRideProps {
  requestInfo: RideRequest;
  driverToPickupDuration: number; // in minutes, may be undefined initially
  pickupToDropoffDuration: number; // in minutes, may be undefined initially
  phase:
    | "headingToPickup"
    | "waitingForPickup"
    | "headingToDropoff"
    | "arrivedAtDropoff";
  changeFlaggingAllowed: (allowed: boolean) => void;
  completeRide: () => void;
  changeNotifState: (notif: NotificationType) => void;
  onCancel: () => void;
  setPhase: (
    phase:
      | "headingToPickup"
      | "waitingForPickup"
      | "headingToDropoff"
      | "arrivedAtDropoff"
  ) => void;
  driverArrivedAtPickup: () => void;
  driverDrivingToDropOff: () => void;
  setStudentIsLate: (isLate: boolean) => void;

  // Progress tracking props
  pickupProgress: number;
  dropoffProgress: number;
  isNearPickup: boolean;
  isNearDropoff: boolean;
  updateSideBarHeight: (height: number) => void;
}

export default function HandleRide({
  phase,
  setPhase,
  requestInfo,
  driverToPickupDuration,
  pickupToDropoffDuration,
  changeFlaggingAllowed,
  completeRide,
  changeNotifState,
  onCancel,
  driverArrivedAtPickup,
  driverDrivingToDropOff,
  setStudentIsLate,
  pickupProgress,
  dropoffProgress,
  isNearPickup,
  isNearDropoff,
  updateSideBarHeight,
}: HandleRideProps) {
  // Timer state
  const [timerDone, setTimerDone] = useState(false);
  const [seconds, setSeconds] = useState(5 * 60); // 5 minutes

  useEffect(() => {
    if (phase === "headingToPickup") {
      changeFlaggingAllowed(false);
    } else if (phase === "waitingForPickup") {
      setSeconds(5 * 60);
      setTimerDone(false);
      const interval = setInterval(() => {
        setSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    } else if (phase === "headingToDropoff" || phase === "arrivedAtDropoff") {
      setStudentIsLate(false);
    }
  }, [phase]);

  // Auto-change to arrivedAtDropoff
  useEffect(() => {
    if (phase === "headingToDropoff" && isNearDropoff) {
      setPhase("arrivedAtDropoff");
    }
  }, [phase, isNearDropoff, setPhase]);

  useEffect(() => {
    if (seconds === 60) {
      changeNotifState({
        text: "Your ride will be canceled in one minute.",
        color: "#FFCBCB",
        boldText: "one minute",
      });
    } else if (seconds <= 0) {
      setTimerDone(true);
      changeFlaggingAllowed(true);
      setStudentIsLate(true);
    }
  }, [seconds]);

  const cancelRide = () => {
    changeNotifState({
      text: "Ride canceled",
      color: "#FF0000",
    });
    onCancel();
  };

  // Open Google Maps
  const openGoogleMapsDirections = async (destination: {
    lat: number;
    lng: number;
    title: string;
  }) => {
    try {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else console.error("Cannot open maps URL");
    } catch (error) {
      console.error(error);
    }
  };

  // Format mm:ss
  const formatTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r < 10 ? "0" : ""}${r}`;
  };

  // Combined progress
  let progress = 0;
  const validatedPickupProgress = Math.min(Math.max(pickupProgress, 0), 1);
  const validatedDropoffProgress = Math.min(Math.max(dropoffProgress, 0), 1);

  if (phase === "headingToPickup" || phase === "waitingForPickup") {
    progress = validatedPickupProgress * 0.45;
  } else if (phase === "headingToDropoff") {
    progress = 0.45 + validatedDropoffProgress * 0.45;
  } else if (phase === "arrivedAtDropoff") {
    progress = 1;
  }

  return (
    <View
      style={[
        {
          position: "absolute",
          bottom: 0,
          width: "100%",
          backgroundColor: "white",
          paddingHorizontal: 16,
          borderRadius: 10,
          paddingVertical: "8%",
          paddingBottom:
            phase === "waitingForPickup" || phase === "arrivedAtDropoff"
              ? 40
              : "15%",
        },
      ]}
      onLayout={(event) => {
        updateSideBarHeight(event.nativeEvent.layout.height);
      }}
    >
      {phase === "headingToPickup" ? (
        <>
          {/* title and passenger name */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 6,
            }}
          >
            <Text style={{ fontSize: 26, fontWeight: "bold", color: "#222" }}>
              Driving to Pickup
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#222" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 2,
                }}
              >
                <Ionicons name="person" size={20} color="#888888" />
                <Text
                  style={{
                    fontSize: 16,
                    marginLeft: 6,
                    color: "#888888",
                    fontWeight: "500",
                  }}
                >
                  ({requestInfo?.numRiders})
                </Text>
              </View>
            </View>
          </View>

          {/* Directions Button */}
          <View style={{ marginTop: 4, marginBottom: 12 }}>
            <Pressable
              style={{
                backgroundColor: "#4B2E83",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                alignSelf: "flex-start",
              }}
              onPress={() => {
                const destination = {
                  lat:
                    requestInfo.locationFrom?.coordinates?.latitude || 47.6062,
                  lng:
                    requestInfo.locationFrom?.coordinates?.longitude ||
                    -122.3321,
                  title: "Pickup Location",
                };
                openGoogleMapsDirections(destination);
              }}
            >
              <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                Directions
              </Text>
            </Pressable>
          </View>

          <View style={styles.driverGreyLine} />

          {/* Unified Progress Bar */}
          <BothProgressBar
            progress={progress}
            toPickupDuration={driverToPickupDuration}
            toDropoffDuration={pickupToDropoffDuration}
            pickupAddress={requestInfo.locationFrom?.name || ""}
            dropoffAddress={requestInfo.locationTo?.name || ""}
          />

          {/* Near pickup button */}
          {isNearPickup && (
            <View style={{ paddingTop: "10%", alignContent: "center" }}>
              <Pressable
                style={{
                  backgroundColor: "#4B2E83",
                  paddingVertical: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => {
                  setPhase("waitingForPickup");
                  driverArrivedAtPickup();
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "600" }}
                >
                  I'm at pickup location
                </Text>
              </Pressable>
            </View>
          )}
        </>
      ) : phase === "waitingForPickup" ? (
        <>
          {/* Title and passenger name */}
          <View style={styles.titlePassengerName}>
            <View style={{ flexDirection: "column" }}>
              <Text style={{ fontSize: 26, fontWeight: "bold", color: "#222" }}>
                Waiting to Pickup
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Ionicons
                  name="time-outline"
                  size={26}
                  color={seconds <= 0 ? "#FF0000" : "#4B2E83"}
                />
                <Text
                  style={{
                    fontSize: 26,
                    marginLeft: 8,
                    color: seconds <= 0 ? "#FF0000" : "#4B2E83",
                    fontWeight: "bold",
                  }}
                >
                  {formatTime(seconds)}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", marginTop: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#222" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: "15%",
                }}
              >
                <Ionicons name="person" size={20} color="#888888" />
                <Text
                  style={{
                    fontSize: 16,
                    marginLeft: 6,
                    color: "#888888",
                    fontWeight: "500",
                  }}
                >
                  ({requestInfo?.numRiders})
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{ height: 1, backgroundColor: "#E0E0E0", marginVertical: 16 }}
          />

          {/* Unified Progress Bar */}
          <BothProgressBar
            progress={progress}
            toPickupDuration={driverToPickupDuration}
            toDropoffDuration={pickupToDropoffDuration}
            pickupAddress={requestInfo.locationFrom?.name || ""}
            dropoffAddress={requestInfo.locationTo?.name || ""}
          />

          {/* Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: "5%",
              paddingBottom: 20,
            }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <Pressable
                style={{
                  backgroundColor: "#4B2E83",
                  paddingVertical: 20,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => {
                  setPhase("headingToDropoff");
                  driverDrivingToDropOff();
                }}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "400" }}>
                  I've found student
                </Text>
              </Pressable>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Pressable
                style={{
                  backgroundColor: seconds <= 0 ? "#FF0000" : "#E0E0E0",
                  ...styles.driverCancelButton,
                }}
                onPress={timerDone ? cancelRide : onCancel}
              >
                <Text
                  style={{
                    color: seconds <= 0 ? "white" : "black",
                    fontSize: 16,
                    fontWeight: "400",
                  }}
                >
                  Cancel request
                </Text>
              </Pressable>
            </View>
          </View>
        </>
      ) : phase === "headingToDropoff" ? (
        <>
          <View style={styles.titlePassengerName}>
            <Text style={{ fontSize: 26, fontWeight: "bold", color: "#222" }}>
              Driving to Dropoff
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#222" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              <View style={styles.driverPersonIcon}>
                <Ionicons name="person" size={20} color="#888888" />
                <Text
                  style={{
                    fontSize: 16,
                    marginLeft: 6,
                    color: "#888888",
                    fontWeight: "500",
                  }}
                >
                  ({requestInfo?.numRiders})
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 4, marginBottom: 12 }}>
            <Pressable
              style={{
                backgroundColor: "#4B2E83",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                alignSelf: "flex-start",
              }}
              onPress={() => {
                const destination = {
                  lat: requestInfo.locationTo?.coordinates?.latitude || 47.6062,
                  lng:
                    requestInfo.locationTo?.coordinates?.longitude || -122.3321,
                  title: "Dropoff Location",
                };
                openGoogleMapsDirections(destination);
              }}
            >
              <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                Directions
              </Text>
            </Pressable>
          </View>

          <View style={styles.driverGreyLine} />

          {/* Unified Progress Bar */}
          <BothProgressBar
            progress={progress}
            toPickupDuration={driverToPickupDuration}
            toDropoffDuration={pickupToDropoffDuration}
            pickupAddress={requestInfo.locationFrom?.name || ""}
            dropoffAddress={requestInfo.locationTo?.name || ""}
          />
        </>
      ) : phase === "arrivedAtDropoff" ? (
        <>
          <View style={styles.titlePassengerName}>
            <Text style={{ fontSize: 26, fontWeight: "bold", color: "#222" }}>
              You've Arrived
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#222" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              <View style={styles.driverPersonIcon}>
                <Ionicons name="person" size={20} color="#888888" />
                <Text
                  style={{
                    fontSize: 16,
                    marginLeft: 6,
                    color: "#888888",
                    fontWeight: "500",
                  }}
                >
                  ({requestInfo?.numRiders})
                </Text>
              </View>
            </View>
          </View>

          {/* Unified Progress Bar (full) */}
          <BothProgressBar
            progress={1}
            toPickupDuration={driverToPickupDuration}
            toDropoffDuration={pickupToDropoffDuration}
            pickupAddress={requestInfo.locationFrom?.name || ""}
            dropoffAddress={requestInfo.locationTo?.name || ""}
          />

          <Pressable
            style={[styles.driverCompleteButton, { marginTop: "2%" }]}
            onPress={completeRide}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              I've dropped off student
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
