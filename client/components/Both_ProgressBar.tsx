// components/Both_ProgressBar.tsx
import { View, Text } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { progressBarStyles } from "../assets/styles"; // adjust path as needed

export default function Both_ProgressBar({
  pickupAddress,
  dropoffAddress,
  driverToPickupMinutes,
  pickupToDropoffMinutes,
}: {
  pickupAddress: string;
  dropoffAddress: string;
  driverToPickupMinutes?: number;
  pickupToDropoffMinutes?: number;
}) {
  return (
    <View style={progressBarStyles.progressBarRowContainer}>
      {/* Start */}
      <View style={progressBarStyles.progressBarNode}>
        <View
          style={{
            borderRadius: 13,
            backgroundColor: "white",
            borderColor: "black",
            borderWidth: 1,
            height: 20,
            width: 20,
          }}
        />
        <Text style={progressBarStyles.progressBarLabel}>Start</Text>
      </View>

      {/* Line 1 with time */}
      <View style={progressBarStyles.progressBarLineContainer}>
        {driverToPickupMinutes != null && (
          <Text style={progressBarStyles.progressBarTimeLabel}>{driverToPickupMinutes} min</Text>
        )}
        <View style={progressBarStyles.progressBarDottedLine} />
      </View>

      {/* Pickup */}
      <View style={progressBarStyles.progressBarNode}>
        
        
        <View
          style={{
            borderRadius: 13,
            backgroundColor: "#4B2E83",
            height: 20,
            width: 20,
          }}
        />
        <Text style={progressBarStyles.progressBarLabel}>Pickup</Text>
        <Text style={progressBarStyles.progressBarAddress}>{pickupAddress}</Text>
      </View>

      {/* Line 2 with time */}
      <View style={progressBarStyles.progressBarLineContainer}>
        {pickupToDropoffMinutes != null && (
          <Text style={progressBarStyles.progressBarTimeLabel}>{pickupToDropoffMinutes} min</Text>
        )}
        <View style={progressBarStyles.progressBarDottedLine} />
      </View>

      {/* Dropoff */}
      <View style={progressBarStyles.progressBarNode}>
        <FontAwesome6 name="location-dot" size={24} color="#d02323" />
        <Text style={progressBarStyles.progressBarLabel}>Dropoff</Text>
        <Text style={progressBarStyles.progressBarAddress}>{dropoffAddress}</Text>
      </View>
    </View>
  );
}