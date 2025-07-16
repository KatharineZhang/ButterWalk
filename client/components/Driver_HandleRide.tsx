import { useState, useEffect } from "react";
import { View, Text, Button, Pressable } from "react-native";
import { RideRequest } from "../../server/src/api";
import { NotificationType } from "./Both_Notification";
import Ionicons from "@expo/vector-icons/Ionicons";
import SegmentedProgressBar from "./Both_SegmentedProgressBar";
import { styles } from "@/assets/styles";
import { ProgressBar } from "react-native-paper";

interface HandleRideProps {
  requestInfo: RideRequest;
  driverToPickupDuration: number; // in minutes, might be undefined initially
  pickupToDropoffDuration: number; // in minutes, might be undefined initially
  changeFlaggingAllowed: (allowed: boolean) => void;
  completeRide: () => void;
  changeNotifState: (notif: NotificationType) => void;
  onCancel: () => void;
  phase:
    | "headingToPickup"
    | "waitingForPickup"
    | "headingToDropoff"
    | "arrivedAtDropoff";
  setPhase: (
    phase:
      | "headingToPickup"
      | "waitingForPickup"
      | "headingToDropoff"
      | "arrivedAtDropoff"
  ) => void;
  driverArrivedAtPickup: () => void;
  driverDrivingToDropOff: () => void;

  // Progress tracking props
  pickupProgress: number;
  dropoffProgress: number;
  isNearPickup: boolean;
  isNearDropoff: boolean;
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
  pickupProgress,
  dropoffProgress,
  isNearPickup,
  isNearDropoff,
}: HandleRideProps) {
  console.log("Driver_HandleRide phase:", phase);
  console.log("Driver_HandleRide isNearDropoff:", isNearDropoff);
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
        text: "Your ride will be cancelled in one minute.",
        color: "#FFCBCB",
        boldText: "one minute",
      });
    } else if (seconds <= 0) {
      // the timer ran out! cancel the ride
      setTimerDone(true);
      changeFlaggingAllowed(true);
    }
  }, [seconds]);

  const cancelRide = () => {
    changeNotifState({
      text: "Ride cancelled",
      color: "#FF0000",
    });
    onCancel();
  };

  // Function to format time (mm:ss)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  // TODO: fix this UI

  // Had to write return statement in if else conditions in order to render phases one at a time
  let content;
  if (phase === "headingToPickup") {
    content = (
      <View style={styles.driverBottomPanel}>
        {/* title and passenger name */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            Driving to Pickup
          </Text>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <View style={{ alignItems: "flex-start" }}>
              <Text style={{ fontSize: 18, fontWeight: "400" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              {/* Person icon and number of passengers */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Ionicons name="person" size={18} color="#888888" />
                <Text style={{ fontSize: 14, marginLeft: 6, color: "#888888" }}>
                  ({requestInfo?.numRiders})
                </Text>
              </View>
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
        {/* Progress Bar */}
        {/* Descriptor above the progress bar ( __ min Ride) */}
        <View
          style={{
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            left: -20,
            marginTop: 24,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {driverToPickupDuration} min Ride
          </Text>
        </View>
        <View style={styles.progressBarWrapper}>
          {/* show white circle */}
          <View style={[styles.circleStart, { backgroundColor: "white" }]} />
          {/* move purple circle to middle */}
          <View style={[styles.circleStart, { left: 130 }]} />
          {/* Progress Bar */}
          <ProgressBar
            progress={pickupProgress}
            color="#C5B4E3"
            style={styles.progressBar}
          />
          <View style={styles.circleEnd} />
        </View>
        {/* If proximity to pickup location is near, 
        Button to confirm pickup shows TODO: add 60s timer */}
        {isNearPickup && (
          <View
            style={{
              position: "absolute",
              bottom: 20,
              left: 24,
              right: 24,
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
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                I'm at pickup location
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  } else if (phase === "waitingForPickup") {
    content = (
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "white",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
          height: "50%",
          width: "100%",
          zIndex: 100,
        }}
      >
        {/* Title and passenger name */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "column" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              Waiting for Pickup
            </Text>
            {/* Timer */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={seconds <= 0 ? "#FF0000" : "#888888"}
              />
              <Text
                style={{
                  fontSize: 16,
                  marginLeft: 8,
                  color: seconds <= 0 ? "#FF0000" : "#888888",
                }}
              >
                {formatTime(seconds)}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-start" }}>
            <Text style={{ fontSize: 18, fontWeight: "400" }}>
              {requestInfo?.netid || "Passenger"}
            </Text>
            {/* Person icon and number of passengers */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Ionicons name="person" size={18} color="#888888" />
              <Text style={{ fontSize: 14, marginLeft: 6, color: "#888888" }}>
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
        <View style={styles.progressBarTop}>
          <View style={styles.progressBarWrapper}>
            {/* show white circle */}
            <View style={[styles.circleStart, { backgroundColor: "white" }]} />
            {/* move purple circle to middle */}
            <View style={[styles.circleStart, { left: 130 }]} />
            {/* Progress Bar */}
            <ProgressBar
              progress={pickupProgress}
              color="#C5B4E3"
              style={styles.progressBar}
            />
            <View style={styles.circleEnd} />
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
        {/* Two buttons side by side */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: "auto",
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
                // call the callback to update the state
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
            {/* Button to cancel ride, turns red and clickable after 5 min counter */}
            <Pressable
              style={{
                backgroundColor: seconds <= 0 ? "#FF0000" : "#E0E0E0",
                ...styles.driverCancelButton,
              }}
              onPress={seconds <= 0 ? cancelRide : onCancel}
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
      </View>
    );
  } else if (phase === "headingToDropoff") {
    content = (
      <View style={{...styles.driverArriveAtDropOff}}>
        {/* title and passenger name */}
        <View style={{...styles.titlePassengerName}}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            Driving to Dropoff
          </Text>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <View style={{ alignItems: "flex-start" }}>
              <Text style={{ fontSize: 18, fontWeight: "400" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              {/* Person icon and number of passengers */}
              <View style={{...styles.driverPersonIcon}}>
                <Ionicons name="person" size={18} color="#888888" />
                <Text style={{ fontSize: 14, marginLeft: 6, color: "#888888" }}>
                  ({requestInfo?.numRiders})
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* Grey line */}
        <View style={{...styles.driverGreyLine}}/>
        {/* Progress Bar */}
        {/* Descriptor above the progress bar ( __ min Ride) */}
      </View>
    );
  } else if (phase === "arrivedAtDropoff") {
    content = (
      <View style={{...styles.driverArriveAtDropOff,}}>
        {/* title and passenger name */}
        <View style={{...styles.titlePassengerName}}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            You've Arrived
          </Text>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <View style={{ alignItems: "flex-start" }}>
              <Text style={{ fontSize: 18, fontWeight: "400" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              {/* Person icon and number of passengers */}
              <View style={{...styles.driverPersonIcon}}>

                <Ionicons name="person" size={18} color="#888888" />
                <Text style={{ fontSize: 14, marginLeft: 6, color: "#888888" }}>
                  ({requestInfo?.numRiders})
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* Grey line */}
        <View style={{...styles.driverGreyLine}}/>

        <Pressable
          style={{...styles.driverCompleteButton}}
          onPress={completeRide}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
            I've dropped off student
          </Text>
        </Pressable>
      </View>
    );
  }

  return <>{content}</>;
}
