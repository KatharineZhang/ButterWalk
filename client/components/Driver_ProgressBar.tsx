import { View, Text, ScrollView } from "react-native";
import { FontAwesome6, Entypo, FontAwesome } from "@expo/vector-icons";

type StudentProgressBarProps = {
  rideStatus: "start" | "pickup" | "dropoff";
  pickUpLocationName: string;
  dropOffLocationName: string;
  pickUpLocationAddress?: string;
  dropOffLocationAddress?: string;
  driverToPickupMinutes?: number;
  pickupToDropoffMinutes?: number;
};

export default function Driver_ProgressBar({
  rideStatus,
  pickUpLocationName,
  dropOffLocationName,
  pickUpLocationAddress,
  dropOffLocationAddress,
  driverToPickupMinutes,
  pickupToDropoffMinutes,
}: StudentProgressBarProps) {
  // Icon colors based on rideStatus
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
    <View style={{ width: "100%", height: "100%" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingRight: "4%", paddingVertical: 8 }}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
      >
        {/* Start Section */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: "5%",
            marginBottom: 8,
          }}
        >
          <View style={{ width: "10%", alignItems: "center" }}>
            <Entypo name="circle" size={20} color={startColor} />
          </View>

          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "bold" }}>Start</Text>
          </View>
        </View>

        {/* Dotted line + Duration to Pickup */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: "5%",
            marginVertical: 4,
          }}
        >
          <View
            style={{
              width: "10%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 2,
                height: 40,
                borderLeftWidth: 2,
                borderLeftColor: grey,
                borderStyle: "dotted",
              }}
            />
          </View>

          {driverToPickupMinutes != null && (
            <View style={{ marginLeft: 16, justifyContent: "center" }}>
              <Text style={{ fontSize: 14, color: "#666" }}>
                {driverToPickupMinutes} min
              </Text>
            </View>
          )}
        </View>

        {/* Pickup Section */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            paddingHorizontal: "5%",
            marginBottom: 8,
          }}
        >
          <View
            style={{
              width: "10%",
              alignItems: "center",
              paddingTop: 3,
            }}
          >
            <FontAwesome name="circle" size={20} color={pickupColor} />
          </View>

          <View style={{ marginLeft: 16, flex: 1, flexDirection: "column" }}>
            <Text style={{ fontSize: 17, fontWeight: "bold" }}>Pickup</Text>
            <Text style={{ fontSize: 14.5, marginTop: 2 }}>
              {pickUpLocationName}
            </Text>
            {pickUpLocationAddress && (
              <Text style={{ fontSize: 14, color: "#666", marginTop: 2 }}>
                {pickUpLocationAddress}
              </Text>
            )}
          </View>
        </View>

        {/* Dotted line + Duration to Dropoff */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: "5%",
            marginVertical: 4,
          }}
        >
          <View
            style={{
              width: "10%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 2,
                height: 40,
                borderLeftWidth: 2,
                borderLeftColor: grey,
                borderStyle: "dotted",
              }}
            />
          </View>

          {pickupToDropoffMinutes != null && (
            <View style={{ marginLeft: 16, justifyContent: "center" }}>
              <Text style={{ fontSize: 14, color: "#666" }}>
                {pickupToDropoffMinutes} min
              </Text>
            </View>
          )}
        </View>

        {/* Dropoff Section */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            paddingHorizontal: "5%",
            marginBottom: 8,
          }}
        >
          <View
            style={{
              width: "10%",
              alignItems: "center",
              paddingTop: 3,
            }}
          >
            <FontAwesome6 name="location-dot" size={24} color={dropoffColor} />
          </View>

          <View style={{ marginLeft: 16, flex: 1, flexDirection: "column" }}>
            <Text style={{ fontSize: 17, fontWeight: "bold" }}>Dropoff</Text>
            <Text style={{ fontSize: 14.5, marginTop: 2 }}>
              {dropOffLocationName}
            </Text>
            {dropOffLocationAddress && (
              <Text style={{ fontSize: 14, color: "#666", marginTop: 2 }}>
                {dropOffLocationAddress}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}