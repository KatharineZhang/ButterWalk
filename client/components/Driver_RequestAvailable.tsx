/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import { View, Text, Pressable, Image } from "react-native";
import { RideRequest } from "../../server/src/api";

interface RequestAvailableProps {
  requestInfo?: RideRequest;
  driverToPickupDuration?: number; // in minutes, might be undefined initially
  pickupToDropoffDuration?: number; // in minutes, might be undefined initially
  onAccept: () => void;
  onLetsGo: () => void;
}

export default function RequestAvailable({
  requestInfo, // might be undefined initially
  driverToPickupDuration, // in minutes, might be undefined initially
  pickupToDropoffDuration, // in minutes, might be undefined initially
  onAccept,
  onLetsGo,
}: RequestAvailableProps) {
  return (
    <View
      style={{
        bottom: 0,
        width: "100%",
        backgroundColor: "white",
        paddingHorizontal: 16,
        borderRadius: 10,
        paddingVertical: "10%",
      }}
    >
      {requestInfo != undefined ? (
        <>
          {/* Show ride request details */}
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>Next Ride</Text>
          {/* ------------------- Your loc -> pick up -> drop off graphic  ----------------- */}

          {/* Your location */}
          <View
            style={{
              marginHorizontal: "14%",
              flexDirection: "row",
              alignItems: "center",
              paddingBottom: "5%",
            }}
          >
            <View
              style={{
                width: 15,
                height: 15,
                borderRadius: 13,
                backgroundColor: "#4B2E83",
              }}
            />
            <View style={{ width: "7%" }} />
            <Text style={{ fontSize: 16 }}>Your Location</Text>
          </View>

          {/* Pickup location */}
          <View
            style={{
              marginHorizontal: "14%",
              flexDirection: "row",
              alignItems: "center",
              paddingBottom: "5%",
            }}
          >
            <View
              style={{
                width: 15,
                height: 15,
                borderRadius: 13,
                backgroundColor: "#4B2E83",
              }}
            />

            <View style={{ width: "7%" }} />
            <Text style={{ fontSize: 16 }}>
              {requestInfo.locationFrom.name}
            </Text>
            {/* TODO: fix the UI for duration */}
            <Text>Duration: {driverToPickupDuration}</Text>
          </View>

          {/* Dropoff Location */}
          <View
            style={{
              marginHorizontal: "13.5%",
              flexDirection: "row",
              alignItems: "center",
              paddingBottom: "5%",
            }}
          >
            <Image
              source={require("@/assets/images/dropoff-location.png")}
              style={{ width: 20, height: 20, resizeMode: "contain" }}
            />
            <View style={{ width: "6.5%" }} />
            <Text style={{ fontSize: 16 }}>{requestInfo.locationTo.name}</Text>
            {/* TODO: fix the UI for duration */}
            <Text>Duration: {pickupToDropoffDuration}</Text>
          </View>

          {/* Let's Go Button */}
          <View style={styles.bottomModalButtonContainer}>
            <Pressable
              style={[styles.bottomModalButton, styles.confirmButton]}
              onPress={onLetsGo}
            >
              <Text
                style={{
                  color: "#4B2E83",
                  fontSize: 18,
                }}
              >
                Let's Go!
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          {/* Title */}
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            New Ride Request
          </Text>

          {/* Body text */}
          <Text style={{ fontSize: 16 }}>
            You have a new ride request! Click 'accept' to start the ride!
          </Text>

          {/* Accept Request Button */}
          <View style={styles.bottomModalButtonContainer}>
            <Pressable
              style={[styles.bottomModalButton, styles.confirmButton]}
              onPress={onAccept}
            >
              <Text
                style={{
                  color: "#4B2E83",
                  fontSize: 18,
                }}
              >
                Accept
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
