/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useRef } from "react";
import { styles } from "@/assets/styles";
import { View, Text, Pressable, Image } from "react-native";
import { RideRequest } from "../../server/src/api";
import BottomSheet from "@gorhom/bottom-sheet";
import BottomDrawer from "./Student_RideReqBottomDrawer";

interface Props {
  requestInfo?: RideRequest;
  onAccept: () => void;
  onLetsGo: () => void;
}

export default function IncomingRideRequest({
  requestInfo, // might be undefined initially
  onAccept,
  onLetsGo,
}: Props) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // expand the bottom sheet
  const expand = () => {
    if (bottomSheetRef == null) {
      console.log("bottomSheetRef is null");
      return;
    }
    bottomSheetRef.current?.expand();
  };

  return (
    <View style={{ flex: 1, pointerEvents: "box-none", width: "100%" }}>
      <BottomDrawer bottomSheetRef={bottomSheetRef}>
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
                TODO: put pick up location here
              </Text>
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
              <Text style={{ fontSize: 16 }}>
                {" "}
                TODO: put Drop off location here
              </Text>
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
      </BottomDrawer>
    </View>
  );
}
