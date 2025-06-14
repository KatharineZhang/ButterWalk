import { useState, useEffect } from "react";
import { View, Text, Button } from "react-native";

type EnroutePhase = "headingToPickup" | "waitingForPickup" | "headingToDropoff";

interface EnrouteProps {
  pickupLocation: string;
  dropoffLocation: string;
  timeToPickup: number;
  timeToDropoff: number;
  numPassengers: number;
  riderName?: string;

  setIsFlagged: (flag: boolean) => void;
  setArrivedPage: () => void;
  setNotificationState: (msg: string) => void;
}

export default function Enroute({
  pickupLocation,
  dropoffLocation,
  timeToPickup,
  timeToDropoff,
  numPassengers,
  riderName,
  setIsFlagged,
  setArrivedPage,
  setNotificationState,
}: EnrouteProps) {
  // State to track which phase the ride is in
  const [phase, setPhase] = useState<EnroutePhase>("headingToPickup");

  // Controls whether the map is zoomed in
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  // When timer is done in "waitingForPickup" state
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => {
    if (phase === "waitingForPickup" || phase === "headingToDropoff") {
      setIsFlagged(true);
    } else {
      setIsFlagged(false);
    }
  }, [phase]);

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: "bold" }}>Enroute Component</Text>

      {/* Phase-specific Views */}
      {phase === "headingToPickup" && (
        <View>
          <Text>Heading to Pickup</Text>
          <Text>Pickup Location: {pickupLocation}</Text>
          <Button
            title="I am at pickup"
            onPress={() => setPhase("waitingForPickup")}
          />
        </View>
      )}

      {phase === "waitingForPickup" && (
        <View>
          <Text>Waiting for Pickup</Text>
          <Button
            title="Found student"
            onPress={() => setPhase("headingToDropoff")}
          />
          {timerDone && (
            <Button
              title="Cancel Ride"
              onPress={() => {
                setNotificationState("Ride canceled.");
                // this will be handled in HomePage, just a placeholder
              }}
            />
          )}
        </View>
      )}

      {phase === "headingToDropoff" && (
        <View>
          <Text>Heading to Dropoff</Text>
          <Text>Dropoff Location: {dropoffLocation}</Text>
          <Button
            title="Arrived at dropoff"
            onPress={setArrivedPage}
          />
        </View>
      )}
    </View>
  );
}
