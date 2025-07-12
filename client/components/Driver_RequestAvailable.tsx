/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import { View, Text, Pressable, Image } from "react-native";
import { RideRequest } from "../../server/src/api";
import { useState, useRef, useEffect } from "react";
import { Animated, Easing } from "react-native";

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
}: RequestAvailableProps) { // switches between screen showing accept button and next ride details
  // once "Let's Go" button is clicked, component should switch over to HandleRide component based on what is in home.tsx
  const [showAcceptScreen, setShowAcceptScreen] = useState(true);
  const rotation = useRef(new Animated.Value(0)).current;
  const swing = rotation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ["30deg", "0deg", "-30deg", "0deg", "30deg"],
  });

  // changes the screen when the driver clicks accept
  const handleAccept = () => {
    onAccept();
    setShowAcceptScreen(false); 
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
            paddingVertical: "10%",
          },
          showAcceptScreen && { paddingBottom: "21%" },
        ]}
      >
      {!showAcceptScreen && requestInfo != undefined ? (
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
              {requestInfo.locationFrom?.name ?? "Unknown pickup location"}
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
            <Text style={{ fontSize: 16 }}>{requestInfo.locationTo?.name ?? "Unknown dropoff location"}</Text>
            {/* TODO: fix the UI for duration */}
            <Text>Duration: {pickupToDropoffDuration}</Text>
          </View>

          {/* Line*/}
          <View
            style={{
              borderBottomColor: "#ccc", 
              borderBottomWidth: 1,
              marginBottom: 5
            }}
          />
          
          {/* Let's Go Button */}
          <View style={styles.bottomModalButtonContainer}>
            <Pressable
              style={[styles.bottomModalButton, styles.button]}
              onPress={onLetsGo}
            >
              <Text
                style={{
                  color: "white",
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
          <View style={{ flexDirection: "row"}}>
            {/* Left side: Title + Body text */}
            <View style={{ flex: 2, paddingLeft: "3%" }}>
              <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12 }}>
                New Ride Request
              </Text>
              <Text style={{ fontSize: 16 }}>
                You have a new ride request!
              </Text>
              <Text style={{ fontSize: 16 }}>
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
              marginTop: 0,     // Small gap above (or 0)
              marginBottom: 3, // Space below the line
            }}
          />
          
          {/* Accept Request Button */}
          <View style={[styles.bottomModalButtonContainer]}>
            <Pressable
              style={[styles.bottomModalButton, styles.button]}
              onPress={handleAccept}
            >
              <Text
                style={{
                  color: "white",
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
