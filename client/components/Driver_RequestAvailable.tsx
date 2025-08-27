/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import { View, Text, Pressable, Image } from "react-native";
import { RideRequest } from "../../server/src/api";
import { useRef, useEffect, useState } from "react";
import { Animated, Easing } from "react-native";

interface RequestAvailableProps {
  requestInfo: RideRequest;
  // switches between screen showing accept button and next ride details
  // once "Let's Go" button is clicked, component should switch over to HandleRide component based on what is in home.tsx
  showAcceptScreen: boolean;
  driverToPickupDuration?: number; // in minutes, might be undefined initially
  pickupToDropoffDuration?: number; // in minutes, might be undefined initially
  onAccept: () => void;
  onLetsGo: () => void;
  updateSideBarHeight: (height: number) => void;
}

export default function RequestAvailable({
  requestInfo, // might be undefined initially
  driverToPickupDuration, // in minutes, might be undefined initially
  pickupToDropoffDuration, // in minutes, might be undefined initially
  showAcceptScreen, // used to switch to the next screen
  onAccept,
  onLetsGo,
  updateSideBarHeight,
}: RequestAvailableProps) {
  // constants used for animation
  const rotation = useRef(new Animated.Value(0)).current;
  const swing = rotation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ["30deg", "0deg", "-30deg", "0deg", "30deg"],
  });
  const [showLoading, setShowLoading] = useState(false);

  // changes the screen when the driver clicks accept
  const handleAccept = () => {
    onAccept();
    setShowLoading(true);
  };

  // animation for clock
  useEffect(() => {
    const swingLoop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    swingLoop.start();

    return () => swingLoop.stop();
  }, []);

  return (
    <View
      style={[
        {
          position: "absolute",
          bottom: 0,
          width: "100%",
          backgroundColor: "white",
          paddingHorizontal: 16,
          borderRadius: 10,
          paddingVertical: "8%",
        },
        showAcceptScreen && { paddingBottom: "21%" }, // the screens require different padding since the containers in each screen took up different sizing
      ]}
      onLayout={(event) => {
        // on render, update the sidebar height to the height of this component
        updateSideBarHeight(event.nativeEvent.layout.height);
      }}
    >
      {/* shows the screen with the "Let's Go" button and the ride graphic. Make sure requestInfo is populated to go to this page */}
      {!showAcceptScreen && requestInfo.netid != undefined ? (
        <>
          {/* Top bar */}
          <View
            style={[
              styles.driverRequestRowCenter,
              { paddingHorizontal: "5%", paddingRight: "5%" },
            ]}
          >
            <Text style={[{ fontSize: 24, fontWeight: "bold" }]}>
              Next Ride
            </Text>
            <View style={{ flex: 1 }} />
            <View style={{ width: "5%", aspectRatio: 1 }}>
              <Image
                source={require("@/assets/images/profile-filled.png")}
                style={{ width: "100%", height: "100%", resizeMode: "contain" }}
              />
            </View>
            <View style={{ width: "1%" }} />
            <Text style={{ fontSize: 17 }}>({requestInfo.numRiders})</Text>
            <View style={{ width: "2%" }} />
            <View
              style={{
                maxWidth: "35%", // or whatever fits best
                overflow: "hidden",
              }}
            >
              {/* the styling ensures that when the text reaches a certain width, it will finish with ellipses */}
              <Text
                style={{ fontSize: 17, fontWeight: "bold" }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {requestInfo.netid}
              </Text>
            </View>
          </View>

          {/* Line*/}
          <View
            style={{
              borderBottomColor: "#ccc",
              borderBottomWidth: 1,
              marginTop: 12,
              marginBottom: 12,
            }}
          />

          {/* ------------------- Your loc -> pick up -> drop off graphic  ----------------- */}
          <View style={{ paddingRight: "4%" }}>
            {/* Your location */}
            <View
              style={[
                styles.driverRequestRowCenter,
                { paddingHorizontal: "12%" },
              ]}
            >
              <View style={{ width: "16%", aspectRatio: 1 }}>
                <Image
                  source={require("@/assets/images/arrow.png")}
                  style={[styles.driverRequestPageImage]}
                />
              </View>

              <Text style={{ fontSize: 17, fontWeight: "bold" }}>
                {" "}
                Your Location{" "}
              </Text>
            </View>

            {/* four dots + driver to pick up duration */}
            <View
              style={[
                styles.driverRequestRowCenter,
                { marginHorizontal: "3.5%" },
              ]}
            >
              <View style={[styles.driverRequestDotsImage]}>
                <View style={{ width: "80%" }}>
                  <Text style={{ fontSize: 14, textAlign: "right" }}>
                    {driverToPickupDuration} min
                  </Text>
                </View>

                <View style={{ width: "40%", aspectRatio: 1, marginLeft: 4 }}>
                  <Image
                    source={require("@/assets/images/four-dots.png")}
                    style={[styles.driverRequestPageImage]}
                  />
                </View>
              </View>
            </View>

            {/* Pickup location */}
            <View
              style={[
                styles.driverRequestRowCenter,
                { paddingHorizontal: "15%" },
              ]}
            >
              <View style={{ width: "9%", aspectRatio: 1 }}>
                <Image
                  source={require("@/assets/images/rider-icon.png")}
                  style={[styles.driverRequestPageImage]}
                />
              </View>

              <View style={{ width: "6%" }} />

              <View style={{ flexDirection: "column" }}>
                <Text style={{ fontSize: 17, fontWeight: "bold" }}>
                  {requestInfo.locationFrom?.name ?? "Pick Up"}
                </Text>
                <Text style={{ fontSize: 14.5 }}>
                  {requestInfo.locationFrom?.address ?? "Pick Up Address"}
                </Text>
              </View>
            </View>

            {/* four dots + drop off duration */}
            <View
              style={[
                styles.driverRequestRowCenter,
                { marginHorizontal: "3.5%" },
              ]}
            >
              <View
                style={[styles.driverRequestDotsImage, { paddingBottom: "2%" }]}
              >
                <View style={{ width: "80%" }}>
                  <Text style={{ fontSize: 14, textAlign: "right" }}>
                    {pickupToDropoffDuration} min
                  </Text>
                </View>

                <View style={{ width: "40%", aspectRatio: 1, marginLeft: 4 }}>
                  <Image
                    source={require("@/assets/images/four-dots.png")}
                    style={[styles.driverRequestPageImage]}
                  />
                </View>
              </View>
            </View>

            {/* Dropoff Location */}
            <View
              style={{
                marginHorizontal: "15%",
                flexDirection: "row",
                paddingBottom: "7%",
              }}
            >
              <View style={{ width: "10%", aspectRatio: 1 }}>
                <Image
                  source={require("@/assets/images/location-on.png")}
                  style={[styles.driverRequestPageImage]}
                />
              </View>

              <View style={{ width: "6%" }} />

              <View style={{ flexDirection: "column" }}>
                <Text style={{ fontSize: 17, fontWeight: "bold" }}>
                  {requestInfo.locationTo?.name ?? "Drop Off"}
                </Text>
                <Text style={{ fontSize: 14.5 }}>
                  {requestInfo.locationTo?.address ?? "Drop Off Address"}
                </Text>
              </View>
            </View>
          </View>

          {/* Line*/}
          <View
            style={{
              borderBottomColor: "#ccc",
              borderBottomWidth: 1,
              marginBottom: 5,
            }}
          />

          {/* Let's Go Button */}
          <View style={styles.bottomModalButtonContainer}>
            <Pressable
              style={[styles.bottomModalButton, styles.button]}
              onPress={onLetsGo}
            >
              <Text style={[styles.buttonLabel]}>Let's Go!</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          {/* shows the screen with the accept button */}
          <View style={{ flexDirection: "row" }}>
            {/* Left side: Title + Body text */}
            <View style={{ flex: 2, paddingLeft: "3%" }}>
              <Text
                style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12 }}
              >
                New Ride Request
              </Text>
              <Text style={{ fontSize: 16 }}>You have a new ride request!</Text>
              <Text style={{ fontSize: 16, marginBottom: -15 }}>
                Click 'Accept' to start the ride!
              </Text>
            </View>

            {/* Right side: Image */}
            <View style={{ flex: 1.2, alignItems: "flex-end" }}>
              <Animated.Image
                source={require("../assets/images/new-ride-alarm.png")}
                style={{
                  width: "80%",
                  height: "80%",
                  transform: [{ rotate: swing }],
                }}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Line*/}
          <View
            style={{
              borderBottomColor: "#ccc",
              borderBottomWidth: 1,
              marginTop: 0,
              marginBottom: 3,
            }}
          />

          {/* Accept Request Button */}
          <View style={[styles.bottomModalButtonContainer]}>
            {showLoading ? (
              <Text
                style={{
                  fontSize: 16,
                  fontStyle: "italic",
                  marginBottom: 8,
                  alignSelf: "center",
                }}
              >
                Retrieving Your Ride...
              </Text>
            ) : (
              <Pressable
                style={[styles.bottomModalButton, styles.button]}
                onPress={handleAccept}
              >
                <Text style={[styles.buttonLabel]}>Accept</Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </View>
  );
}
