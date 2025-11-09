import { View, Text, Pressable } from "react-native";
import { FontAwesome6, Entypo, FontAwesome } from "@expo/vector-icons";
import { progressBarStyles } from "../assets/styles";
import { useState } from "react";

export default function Both_ProgressBar({
  rideStatus,
  pickupAddress,
  dropoffAddress,
  driverToPickupMinutes,
  pickupToDropoffMinutes,
}: {
  rideStatus: "start" | "pickup" | "dropoff";
  pickupAddress: string;
  dropoffAddress: string;
  driverToPickupMinutes?: number;
  pickupToDropoffMinutes?: number;
}) {
  const [showDetails, setShowDetails] = useState(false);

  // Define icon colors based on rideStatus
  const grey = "#adacaa";
  const purple = "#4B2E83";
  const red = "#d02323";
  const black = "black";

  // Default (active) colors
  let startColor = black;
  let pickupColor = purple;
  let dropoffColor = red;

  if (rideStatus === "start") {
    startColor = black;
    pickupColor = grey;
    dropoffColor = grey;
  } else if (rideStatus === "pickup") {
    startColor = grey;
    pickupColor = purple;
    dropoffColor = grey;
  } else if (rideStatus === "dropoff") {
    startColor = grey;
    pickupColor = grey;
    dropoffColor = red;
  }

  return (
    <View style={{ width: "100%" }}>
      {/* Row 1: Minutes and Details */}
      <View style={progressBarStyles.progressBarMinutesRow}>
        <View style={progressBarStyles.progressBarMinutesSection}>
          {driverToPickupMinutes != null && (
            <Text style={progressBarStyles.progressBarTimeLabel}>
              {driverToPickupMinutes} min
            </Text>
          )}
        </View>
        <View style={progressBarStyles.progressBarMinutesSection}>
          {pickupToDropoffMinutes != null && (
            <Text style={progressBarStyles.progressBarTimeLabel}>
              {pickupToDropoffMinutes} min
            </Text>
          )}
          <Pressable onPress={() => setShowDetails(!showDetails)}>
            <Text style={progressBarStyles.progressBarDetailsLink}>
              {showDetails ? "Less Details" : "More Details"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Row 2: Icons and Dotted Lines */}
      <View style={progressBarStyles.progressBarIconRow}>
        {/* Start Icon */}
        <Entypo name="circle" size={20} color={startColor} />

        {/* Line 1 */}
        <View style={progressBarStyles.progressBarLine}>
          <View style={progressBarStyles.progressBarDottedLine} />
        </View>

        {/* Pickup Icon */}
        <FontAwesome name="circle" size={20} color={pickupColor} />

        {/* Line 2 */}
        <View style={progressBarStyles.progressBarLine}>
          <View style={progressBarStyles.progressBarDottedLine} />
        </View>

        {/* Dropoff Icon */}
        <FontAwesome6 name="location-dot" size={24} color={dropoffColor} />
      </View>

      {/* Row 3: Labels */}
      <View style={progressBarStyles.progressBarLabelRow}>
        <View style={progressBarStyles.progressBarLabelSectionStart}>
          <Text style={progressBarStyles.progressBarLabel}>Start</Text>
        </View>
        <View style={progressBarStyles.progressBarLabelSection}>
          <Text style={progressBarStyles.progressBarLabel}>Pickup</Text>
          {showDetails && (
            <Text style={progressBarStyles.progressBarAddressPickup}>
              {pickupAddress}
            </Text>
          )}
        </View>
        <View style={progressBarStyles.progressBarLabelSectionDropoff}>
          <Text style={progressBarStyles.progressBarLabel}>Dropoff</Text>
          {showDetails && (
            <Text style={progressBarStyles.progressBarAddressDropoff}>
              {dropoffAddress}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
