import { useState, useEffect } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { RideRequest } from "../../server/src/api";
import { NotificationType } from "./Both_Notification";
import Ionicons from "@expo/vector-icons/Ionicons";
import { styles } from "@/assets/styles";
import Both_ProgressBar from "./Both_ProgressBar";

interface HandleRideProps {
  requestInfo: RideRequest;
  driverToPickupDuration: number; // in minutes, might be undefined initially
  pickupToDropoffDuration: number; // in minutes, might be undefined initially
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
  setStudentIsLate: (isLate: boolean) => void; // callback to set student late state
  makeCall: (phoneNumber: string) => void;

  // Progress tracking props
  pickupProgress: number;
  dropoffProgress: number;
  isNearPickup: boolean;
  isNearDropoff: boolean;
  studentPhoneNumber: string;
  updateSideBarHeight: (height: number) => void;
}



export default function HandleRide({
  phase,
  requestInfo,
  driverToPickupDuration,
  pickupToDropoffDuration,
  isNearPickup,
  isNearDropoff,
  studentPhoneNumber,
  makeCall,
  setPhase,
  changeFlaggingAllowed,
  completeRide,
  changeNotifState,
  onCancel,
  driverArrivedAtPickup,
  driverDrivingToDropOff,
  setStudentIsLate,
  updateSideBarHeight,
}: HandleRideProps) {
  // When timer is done in "waitingForPickup" state
  const [timerDone, setTimerDone] = useState(false);
  const [seconds, setSeconds] = useState(5 * 60); // 5 minutes

  useEffect(() => {
    if (phase === "headingToPickup") {
      changeFlaggingAllowed(false);
    } else if (phase === "waitingForPickup") {
      // Reset timer when entering waitingForPickup phase, 5 min
      setSeconds(5 * 60);
      setTimerDone(false);
      // Update seconds every second
      const interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds <= 0) {
            return 0; // Stop at 0
          }
          return prevSeconds - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (phase === "headingToDropoff" || phase === "arrivedAtDropoff") {
      setStudentIsLate(false);
    }
  }, [phase]);

  // Automatically change to arrivedAtDropoff phase when near dropoff
  useEffect(() => {
    if (phase === "headingToDropoff" && isNearDropoff) {
      setPhase("arrivedAtDropoff");
    }
  }, [phase, isNearDropoff, setPhase]);

  useEffect(() => {
    if (seconds == 60) {
      changeNotifState({
        text: "Your ride will be canceled in one minute.",
        color: "#FFCBCB",
        boldText: "one minute",
        trigger: Date.now(),
      });
    } else if (seconds <= 0) {
      // the timer ran out! cancel the ride
      setTimerDone(true);
      changeFlaggingAllowed(true);
      setStudentIsLate(true);
    }
  }, [seconds]);

  const cancelRide = () => {
    changeNotifState({
      text: "Ride canceled",
      color: "#FFCBCB",
      trigger: Date.now(),
    });
    onCancel();
  };

  // Function to open Google Maps with directions while app still runs in background
  const openGoogleMapsDirections = async (destination: {
    lat: number;
    lng: number;
    title: string;
  }) => {
    try {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error("Cannot open maps URL");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Function to format time (mm:ss)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  return (
    <View
      style={[
        {
          // position absolute here for now, otherwise styling of other
          //components in home get messed up
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
              {/* Person icon and number of passengers */}
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

          <View
            style={{
              marginTop: 4,
              marginBottom: 12,
              flexDirection: "row", // row layout
              alignItems: "center", // vertically align buttons
            }}
          >
            {/* Directions Button */}
            <Pressable
              style={{
                backgroundColor: "#4B2E83",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
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

          {/* Grey line */}
          <View style={styles.driverGreyLine} />

          {/* Progress Bar Section */}
          <Both_ProgressBar
          pickupAddress={requestInfo.locationFrom.address}
          dropoffAddress={requestInfo.locationTo.address}
          driverToPickupMinutes={driverToPickupDuration}
          pickupToDropoffMinutes={pickupToDropoffDuration}
          />

          {/* If proximity to pickup location is near, 
          panel grows and button to confirm pickup shows */}
          {isNearPickup && (
            <View
              style={{
                paddingTop: "10%",
                alignContent: "center",
              }}
            >
              <Pressable
                style={{
                  backgroundColor: "#4B2E83",
                  paddingVertical: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => {
                  // call the callback to move onto next phase
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
              {/* Timer */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                {/* changes to red after countdown reaches 0 */}
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
              {/* Person icon and number of passengers */}
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
          {/* Grey line */}
          <View
            style={{
              height: 1,
              backgroundColor: "#E0E0E0",
              marginVertical: 16,
            }}
          />

          {/* Actual Progress Bar */}
          <Both_ProgressBar
          pickupAddress={requestInfo.locationFrom.address}
          dropoffAddress={requestInfo.locationTo.address}
          driverToPickupMinutes={driverToPickupDuration}
          pickupToDropoffMinutes={pickupToDropoffDuration}
          />


          {/* Two buttons side by side */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: "5%",
              paddingBottom: 20,
            }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              {/* Button to confirm student was picked up */}
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
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "400" }}
                >
                  I've found student
                </Text>
              </Pressable>
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              {/* Button to cancel ride */}
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

          {/* Call Student Button (underneath) */}
          <View style={{ marginTop: 10 }}>
            <Pressable
              style={{
                backgroundColor: "#4B2E83",
                paddingVertical: 20,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => {
                makeCall(studentPhoneNumber);
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "400" }}>
                Call Student
              </Text>
            </Pressable>
          </View>
        </>
      ) : phase === "headingToDropoff" ? (
        <>
          {/* title and passenger name */}
          <View style={styles.titlePassengerName}>
            <Text style={{ fontSize: 26, fontWeight: "bold", color: "#222" }}>
              Driving to Dropoff
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#222" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              {/* Person icon and number of passengers */}
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

          {/*Directions Button */}
          <View
            style={{
              marginTop: 4,
              marginBottom: 12,
            }}
          >
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

          {/* Grey line */}
          <View style={styles.driverGreyLine} />
          {/* Progress Bar Section */}
          <Both_ProgressBar
            pickupAddress={requestInfo.locationFrom.address}
            dropoffAddress={requestInfo.locationTo.address}
            driverToPickupMinutes={driverToPickupDuration}
            pickupToDropoffMinutes={pickupToDropoffDuration}
          />
        </>
      ) : phase === "arrivedAtDropoff" ? (
        <>
          {/* title and passenger name */}
          <View style={styles.titlePassengerName}>
            <Text style={{ fontSize: 26, fontWeight: "bold", color: "#222" }}>
              You've Arrived
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#222" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              {/* Person icon and number of passengers */}
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
          {/* Progress Bar Section */}
          <Both_ProgressBar
            pickupAddress={requestInfo.locationFrom.address}
            dropoffAddress={requestInfo.locationTo.address}
            driverToPickupMinutes={driverToPickupDuration}
            pickupToDropoffMinutes={pickupToDropoffDuration}
          />

          {/* Grey line */}
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
