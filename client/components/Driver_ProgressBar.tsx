import { View, Text, ScrollView } from "react-native";
import { FontAwesome6, Entypo, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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
    <View style={{ width: "100%", height: 160 }}>
      {/* TOP fade */}
      <LinearGradient
        colors={["rgba(255,255,255,1)", "rgba(255,255,255,0)"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 20,
          zIndex: 10,
        }}
        pointerEvents="none"
      />

      {/* BOTTOM fade */}
      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,1)"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 20,
          zIndex: 10,
        }}
        pointerEvents="none"
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
      >
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View
            style={{
              width: "10%",
              alignItems: "center",
              flexDirection: "column",
              paddingVertical: "5%",
            }}
          >
            <Entypo name="circle" size={20} color={startColor} />

            {/* Dotted line */}
            <View style={{ flex: 1, justifyContent: "center" }}>
              {[...Array(10)].map((_, i) => (
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

            <FontAwesome name="circle" size={20} color={pickupColor} />

            {/* Dotted line */}
            <View style={{ flex: 1, justifyContent: "center" }}>
              {[...Array(10)].map((_, i) => (
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

            <FontAwesome6 name="location-dot" size={24} color={dropoffColor} />
          </View>

          {/* Right container: All text content */}
          <View
            style={{
              flex: 1,
              paddingLeft: "5%",
              paddingTop: "5%",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            {/* Start Text */}
            <View style={{ paddingBottom: "5%" }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>Start</Text>
            </View>

            {/* Pickup Text */}
            <View style={{ paddingVertical: "6%" }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {pickUpLocationName}
              </Text>
              {pickUpLocationAddress && (
                <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                  {pickUpLocationAddress}
                </Text>
              )}
            </View>

            {/* Dropoff Text */}
            <View style={{ paddingTop: "5%" }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {dropOffLocationName}
              </Text>
              {dropOffLocationAddress && (
                <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                  {dropOffLocationAddress}
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
