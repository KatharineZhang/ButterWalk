import { useState, useEffect } from "react";
import { View, Text, Button } from "react-native";
import { RideRequest } from "../../server/src/api";
import { NotificationType } from "./Both_Notification";

type HandleRidePhase =
  | "headingToPickup"
  | "waitingForPickup"
  | "headingToDropoff"
  | "arrivedAtDropoff";

interface HandleRideProps {
  requestInfo: RideRequest;
  driverToPickupDuration: number; // in minutes, might be undefined initially
  pickupToDropoffDuration: number; // in minutes, might be undefined initially
  changeFlaggingAllowed: (allowed: boolean) => void;
  goHome: () => void;
  changeNotifState: (notif: NotificationType) => void;
  onCancel: () => void;
}

export default function HandleRide({
  requestInfo,
  driverToPickupDuration,
  pickupToDropoffDuration,
  changeFlaggingAllowed,
  goHome,
  changeNotifState,
  onCancel,
}: HandleRideProps) {
  // State to track which phase the ride is in
  const [phase, setPhase] = useState<HandleRidePhase>("headingToPickup");

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
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: "bold" }}>HandleRide Component</Text>

      {/* Phase-specific Views */}
      {phase === "headingToPickup" ? (
        <View>
          <Text>Heading to Pickup</Text>
          <Text>Duration: {driverToPickupDuration}</Text>
          <Text>Duration: {pickupToDropoffDuration}</Text>
          <Text>
            Pickup Location: {JSON.stringify(requestInfo.locationFrom)}
          </Text>
          <Button
            title="I am at pickup"
            onPress={() => setPhase("waitingForPickup")}
          />
        </View>
      ) : phase === "waitingForPickup" ? (
        <View>
          <Text>Waiting for Pickup</Text>
          <Text>
            Time remaining: {formatTime(seconds)}{" "}
            {seconds <= 60 && <Text>(Ride will be cancelled soon)</Text>}
          </Text>
          <Button
            title="Found student"
            onPress={() => setPhase("headingToDropoff")}
          />
          {timerDone && <Button title="Cancel Ride" onPress={cancelRide} />}
        </View>
      ) : phase === "headingToDropoff" ? (
        <View>
          <Text>Heading to Dropoff</Text>
          <Text>
            Dropoff Location: {JSON.stringify(requestInfo.locationTo)}
          </Text>
          <Button title="Arrived at dropoff" onPress={goHome} />
        </View>
      ) : (
        <View>
          <Text>Arrived at Dropoff</Text>
          <Text>Thank you for completing the ride!</Text>
          <Button title="Go Home" onPress={goHome} />
        </View>
      )}
    </View>
  );
}
