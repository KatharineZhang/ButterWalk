import { View, Text } from "react-native";
import { FontAwesome6, Entypo, FontAwesome } from "@expo/vector-icons";
import { progressBarStyles } from "../assets/styles";

type StudentProgressBarProps = {
  rideStatus: "start" | "pickup" | "dropoff";
  pickUpLocationName: string;
  dropOffLocationName: string;
  driverToPickupMinutes?: number;
  pickupToDropoffMinutes?: number;
};

export default function Student_ProgressBar({
  rideStatus,
  pickUpLocationName,
  dropOffLocationName,
  driverToPickupMinutes,
  pickupToDropoffMinutes,
}: StudentProgressBarProps) {
  // icon colors based on rideStatus
  const grey = "#adacaa";
  const purple = "#4B2E83";
  const red = "#d02323";

  // Default icon colors
  let startColor = purple;
  let pickupColor = purple;
  let dropoffColor = red;

  if (rideStatus === "start") {
    startColor = purple;
    pickupColor = purple;
    dropoffColor = red;
  } else if (rideStatus === "pickup") {
    startColor = grey;
    pickupColor = purple;
    dropoffColor = red;
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
      <View
        style={[
          progressBarStyles.progressBarLabelRow,
          { marginHorizontal: "3.5%", marginTop: "1%" },
        ]}
      >
        <View style={progressBarStyles.progressBarLabelSectionStart}>
          <Text style={progressBarStyles.progressBarLabel}>Start</Text>
        </View>
        <View style={progressBarStyles.progressBarLabelSection}>
          <Text style={progressBarStyles.progressBarLabel}>Pickup</Text>
          <Text style={progressBarStyles.progressBarLocationNamePickup}>
            {pickUpLocationName}
          </Text>
        </View>
        <View
          style={[
            progressBarStyles.progressBarLabelSectionDropoff,
            { paddingLeft: "4%" },
          ]}
        >
          <Text style={progressBarStyles.progressBarLabel}>Dropoff</Text>
          <Text style={progressBarStyles.progressBarLocationNameDropoff}>
            {dropOffLocationName}
          </Text>
        </View>
      </View>
    </View>
  );
}
