// components/Both_ProgressBar.tsx
import React from "react";
import { View, Text } from "react-native";
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
        <View style={progressBarStyles.progressBarStartIcon} />
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
        <View style={progressBarStyles.progressBarPickupIcon} />
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
        <View style={progressBarStyles.progressBarDropoffIcon} />
        <Text style={progressBarStyles.progressBarLabel}>Dropoff</Text>
        <Text style={progressBarStyles.progressBarAddress}>{dropoffAddress}</Text>
      </View>
    </View>
  );
}