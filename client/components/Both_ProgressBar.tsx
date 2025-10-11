// components/Both_ProgressBar.tsx (timeline replacement)
import React from "react";
import { View, Text, TextStyle, ViewStyle } from "react-native";

type Phase =
  | "headingToPickup"
  | "waitingForPickup"
  | "headingToDropoff"
  | "arrivedAtDropoff";

export default function Both_Timeline({
  phase,
  startLabel = "Start",
  pickupLabel = "Pickup",
  dropoffLabel = "Dropoff",
  driverToPickupMinutes,
  pickupToDropoffMinutes,
}: {
  phase: Phase;
  startLabel?: string;
  pickupLabel?: string;
  dropoffLabel?: string;
  driverToPickupMinutes?: number;
  pickupToDropoffMinutes?: number;
}) {
  // state -> which steps are completed
  const startCompleted =
    phase === "waitingForPickup" ||
    phase === "headingToDropoff" ||
    phase === "arrivedAtDropoff";
  const pickupCompleted = phase === "headingToDropoff" || phase === "arrivedAtDropoff";
  const dropoffCompleted = phase === "arrivedAtDropoff";

  const startActive = !startCompleted;
  const pickupActive = !pickupCompleted && startCompleted;
  const dropoffActive = !dropoffCompleted && pickupCompleted;

  const colorActive = "#4B2E83";   // purple
  const colorCompleted = "#C9C9D1"; // grey
  const colorIdle = "#EAE8F6";      // light track

  const dotStyle = (active: boolean, completed: boolean): ViewStyle => ({
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: completed ? colorCompleted : active ? colorActive : "#FFFFFF",
    borderWidth: completed ? 0 : 2,
    borderColor: active ? colorActive : colorCompleted,
  });

  const labelTextStyle = (active: boolean, completed: boolean): TextStyle => ({
    fontSize: 13,
    // cast to satisfy RN's union type for fontWeight
    fontWeight: (active ? "700" : "600") as TextStyle["fontWeight"],
    color: completed ? "#6E6E78" : active ? "#1F1A3D" : "#6E6E78",
    marginTop: 8,
  });

  const timeTextStyle: TextStyle = {
    fontSize: 11,
    color: "#6E6E78",
    marginTop: 4,
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      {/* background track */}
      <View
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          top: 15,
          height: 2,
          backgroundColor: colorIdle,
        }}
      />

      {/* 3 milestones */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        {/* Start */}
        <View style={{ alignItems: "center" }}>
          <View style={dotStyle(startActive, startCompleted)} />
          <Text style={labelTextStyle(startActive, startCompleted)}>{startLabel}</Text>
          <Text style={timeTextStyle}>
            {driverToPickupMinutes != null ? `${driverToPickupMinutes} min` : " "}
          </Text>
        </View>

        {/* Pickup */}
        <View style={{ alignItems: "center" }}>
          <View style={dotStyle(pickupActive, pickupCompleted)} />
          <Text style={labelTextStyle(pickupActive, pickupCompleted)}>{pickupLabel}</Text>
          <Text style={timeTextStyle}>
            {pickupToDropoffMinutes != null ? `${pickupToDropoffMinutes} min` : " "}
          </Text>
        </View>

        {/* Dropoff */}
        <View style={{ alignItems: "center" }}>
          <View style={dotStyle(dropoffActive, dropoffCompleted)} />
          <Text style={labelTextStyle(dropoffActive, dropoffCompleted)}>{dropoffLabel}</Text>
          <Text style={timeTextStyle}>{/* no ETA for final */} </Text>
        </View>
      </View>
    </View>
  );
}
