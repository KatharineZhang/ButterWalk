import { useState, useEffect } from "react";
import { View, Text, Button } from "react-native";
import { RideRequest } from "../../server/src/api";
import { NotificationType } from "./Both_Notification";
import Ionicons from "@expo/vector-icons/Ionicons";
import SegmentedProgressBar from "./Both_SegmentedProgressBar";

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
  onArriveAtPickup: () => void; // new callback for when driver arrives at pickup
  onDrivingToDropoff: () => void; // new callback for when driver starts driving to dropoff
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
  onArriveAtPickup,
  onDrivingToDropoff,
}: HandleRideProps) {
  // When timer is done in "waitingForPickup" state
  const [timerDone, setTimerDone] = useState(false);
  const [seconds, setSeconds] = useState(5 * 60); // 5 minutes

  useEffect(() => {
    if (phase === "headingToPickup") {
      changeFlaggingAllowed(false);
    } else {
      if (phase === "waitingForPickup") {
        // Update seconds every second
        const interval = setInterval(() => {
          setSeconds((prevSeconds) => prevSeconds - 1);
        }, 1000);
        // TODO: make sure timer actually stops
        return () => clearInterval(interval);
      }
    }
  }, [phase]);

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
  return (
    // phase specific views
    // so far I have bare bones for headingToPickup and waitingForPickup
    <>
      {phase === "headingToPickup" && (
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
            maxHeight: "50%",
            width: "100%",
          }}
        >
          {/* title and passenger name */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              Driving to Pickup
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              {requestInfo?.netid || "Passenger"}
            </Text>
          </View>
          {/* Person icon and number of passengers */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="person" size={22} color="#4B2E83" />
            <Text style={{ fontSize: 16, marginLeft: 8 }}>
              ({requestInfo?.numRiders || 1})
            </Text>
          </View>
          {/* Grey line */}
          <View
            style={{
              height: 1,
              backgroundColor: "#E0E0E0",
              marginVertical: 12,
            }}
          />
          {/* Progress Bar, not working?? */}
          <SegmentedProgressBar type={1} />
          {/* Button to confirm pickup, TODO: add 60s timer */}
          {isNearPickup && (
            <View style={{ marginTop: 20 }}>
              <Button
                title="I am at pickup location"
                color="#4B2E83"
                onPress={() => {
                  // call the callback to update the state
                  setPhase("waitingForPickup");
                  onArriveAtPickup();
                }}
              />
            </View>
          )}
        </View>
      )}
      {phase === "waitingForPickup" ? (
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
            maxHeight: "50%",
            width: "100%",
            zIndex: 100,
          }}
        >
          {/* Title and passenger name */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              Waiting for Pickup
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              {requestInfo?.netid || "Passenger"}
            </Text>
          </View>
          {/* Person icon and number of passengers */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="person" size={22} color="#4B2E83" />
            <Text style={{ fontSize: 16, marginLeft: 8 }}>
              ({requestInfo?.numRiders || 1})
            </Text>
          </View>
          {/* Grey line */}
          <View
            style={{
              height: 1,
              backgroundColor: "#E0E0E0",
              marginVertical: 12,
            }}
          />
          {/* Progress Bar */}
          <SegmentedProgressBar type={1} />
          {/* Two buttons side by side */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <Button
                title="I have found my student"
                color="#4B2E83"
                onPress={() => {
                  // call the callback to update the state
                  setPhase("headingToDropoff");
                  onDrivingToDropoff();
                }}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Button title="Cancel request" color="#888" onPress={onCancel} />
            </View>
          </View>
        </View>
      ) : phase === "headingToDropoff" ? (
        <View>
          <Text>Heading to Dropoff</Text>
          <Text>
            Dropoff Location: {JSON.stringify(requestInfo.locationTo)}
          </Text>
          <Button title="Arrived at dropoff" onPress={completeRide} />
        </View>
      ) : (
        <View>
          <Text>Arrived at Dropoff</Text>
          <Text>Thank you for completing the ride!</Text>
          <Button title="Go Home" onPress={completeRide} />
        </View>
      )}
    </>
  );
}
