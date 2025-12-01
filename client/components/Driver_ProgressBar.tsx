import { View, Text } from "react-native";
import { FontAwesome6, Entypo, FontAwesome } from "@expo/vector-icons";

type StudentProgressBarProps = {
  rideStatus: "start" | "pickup" | "dropoff";
  pickUpLocationName: string;
  dropOffLocationName: string;
  pickUpLocationAddress?: string;
  dropOffLocationAddress?: string;
};

export default function Driver_ProgressBar({
  rideStatus,
  pickUpLocationName,
  dropOffLocationName,
  pickUpLocationAddress,
  dropOffLocationAddress,
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
    <View style={{ width: "100%" }}>
      <View style={{ flex: 1, flexDirection: "column" }}>
        <View
          style={{
            alignItems: "flex-start",
            flexDirection: "column",
          }}
        >
          <View style={{ alignItems: "center", flexDirection: "row" }}>
            {/* Start Icon */}
            <View>
              <Entypo name="circle" size={20} color={startColor} />
            </View>

            {/* Start Text */}
            <View style={{ paddingLeft: "4%" }}>
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>Start</Text>
            </View>
          </View>

          {/* Dotted line */}
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              paddingLeft: "2.5%",
              paddingVertical: "1%",
            }}
          >
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={{
                  width: 2,
                  height: 4,
                  backgroundColor: grey,
                  marginVertical: 2,
                  borderRadius: 2,
                }}
              />
            ))}
          </View>

          <View style={{ alignItems: "center", flexDirection: "row" }}>
            {/* Pickup Icon */}
            <View>
              <FontAwesome name="circle" size={20} color={pickupColor} />
            </View>

            {/* Pickup Text */}
            <View style={{ paddingHorizontal: "4%" }}>
              <Text
                style={{ fontSize: 14, fontWeight: "bold", flexWrap: "wrap" }}
              >
                {pickUpLocationName}
              </Text>
              {pickUpLocationAddress && (
                <Text style={{ fontSize: 14, color: "#666", marginTop: 2 }}>
                  {pickUpLocationAddress}
                </Text>
              )}
            </View>
          </View>

          {/* Dotted line */}
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              paddingLeft: "2.5%",
              paddingVertical: "1%",
            }}
          >
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={{
                  width: 2,
                  height: 4,
                  backgroundColor: grey,
                  marginVertical: 2,
                  borderRadius: 2,
                }}
              />
            ))}
          </View>

          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
            }}
          >
            {/* dropoff Icon */}
            <View>
              <FontAwesome6
                name="location-dot"
                size={24}
                color={dropoffColor}
              />
            </View>

            {/* Dropoff Text */}
            <View style={{ paddingHorizontal: "4%" }}>
              <Text
                style={{ fontSize: 14, fontWeight: "bold", flexWrap: "wrap" }}
              >
                {dropOffLocationName}
              </Text>
              {dropOffLocationAddress && (
                <Text style={{ fontSize: 14, color: "#666", marginTop: 2 }}>
                  {dropOffLocationAddress}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
