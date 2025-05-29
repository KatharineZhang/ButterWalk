import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import {
  RequestRideResponse,
  DriverAcceptResponse,
} from "../../../server/src/api";

interface Props {
  requestInfo: RequestRideResponse;
  driverAcceptInfo: DriverAcceptResponse | null;
  onAccept: () => void;
  onLetsGo: () => void;
}

export default function IncomingRideRequest({
  requestInfo,
  driverAcceptInfo,
  onAccept,
  onLetsGo,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const handleAccept = () => {
    onAccept();
    setShowDetails(true);
  };

  if (!showDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Incoming Ride Request</Text>
        <Text>Pickup: {requestInfo.response}</Text>
        <Button title="Accept" onPress={handleAccept} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride Details</Text>
      <Text>Pickup: {driverAcceptInfo?.location ?? "Loading..."}</Text>
      <Text>Drop‑off: {driverAcceptInfo?.destination ?? "Loading..."}</Text>
      <Text>
        Passengers: {driverAcceptInfo?.numRiders ?? "Loading..."}
      </Text>
      <Button
        title="Let's go"
        onPress={onLetsGo}
        disabled={!driverAcceptInfo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
});
