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
    <View style={progressBarStyles.progressBarRowContainer}>
      {/* Start */}
      <View style={progressBarStyles.progressBarNode}>
        <Entypo name="circle" size={20} color={startColor} />
        <Text style={progressBarStyles.progressBarLabel}>Start</Text>
      </View>

      {/* Line 1 with time */}
      <View style={progressBarStyles.progressBarLineContainer}>
        {driverToPickupMinutes != null && (
          <Text style={progressBarStyles.progressBarTimeLabel}>
            {driverToPickupMinutes} min
          </Text>
        )}
        <View style={progressBarStyles.progressBarDottedLine} />
      </View>

      {/* Pickup */}
      <View style={progressBarStyles.progressBarNode}>
        <FontAwesome name="circle" size={20} color={pickupColor} />
        <Text style={progressBarStyles.progressBarLabel}>Pickup</Text>
        <Text style={progressBarStyles.progressBarAddress}>
          {pickupAddress}
        </Text>
      </View>

      {/* Line 2 with time and more details link */}
      <View style={progressBarStyles.progressBarLineContainer}>
        <View style={progressBarStyles.progressBarTimeLabelContainer}>
          {pickupToDropoffMinutes != null && (
            <Text style={progressBarStyles.progressBarTimeLabel}>
              {pickupToDropoffMinutes} min
            </Text>
          )}
          <Pressable onPress={() => setShowDetails(!showDetails)}>
            <Text style={progressBarStyles.progressBarDetailsLink}>
              {showDetails ? "less details" : "more details"}
            </Text>
          </Pressable>
        </View>
        <View style={progressBarStyles.progressBarDottedLine} />
      </View>

      {/* Dropoff */}
      <View style={progressBarStyles.progressBarNode}>
        <FontAwesome6 name="location-dot" size={24} color={dropoffColor} />
        <Text style={progressBarStyles.progressBarLabel}>Dropoff</Text>
        <Text style={progressBarStyles.progressBarAddress}>
          {dropoffAddress}
        </Text>
      </View>
    </View>
  );
}

