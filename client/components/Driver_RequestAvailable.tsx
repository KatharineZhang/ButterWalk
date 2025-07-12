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
            paddingVertical: "8%",
          },
          showAcceptScreen && { paddingBottom: "21%" },
        ]}
      >
      {!showAcceptScreen && requestInfo != undefined ? (
        <>
          {/* Top bar */}
          <View style={[ styles.rowCenterContainer, {paddingHorizontal: "5%"} ]}>
            <Text style={[{ fontSize: 24, fontWeight: "bold" }]}>Next Ride</Text>
            <View style={{ width: "48%"}}></View>
            <View style={{ width: "7%", aspectRatio: 1 }}>
              <Image 
                source={require("@/assets/images/profile-filled.png")}
                style={{ width: "80%", height: "100%", resizeMode: "contain" }}
              />
            </View>
            <Text style={{ fontSize: 17, fontWeight: "bold", marginLeft: 4 }}>
                ({requestInfo.numRiders})
            </Text>
          </View>

          {/* Line*/}
          <View style={{  
            borderBottomColor: "#ccc", 
            borderBottomWidth: 1,
            marginTop: 12,     
            marginBottom: 12,}}
          />

          {/* ------------------- Your loc -> pick up -> drop off graphic  ----------------- */}
          <View style={{ paddingRight: "4%"}}> 
            {/* Your location */}
            <View style={[ styles.rowCenterContainer, {paddingHorizontal: "5%"} ]}>
              <View style={{ width: "16%", aspectRatio: 1 }}>
                <Image
                  source={require("@/assets/images/arrow.png")}
                  style={[styles.requestPageImage]}
                />
              </View>

              <Text style={{ fontSize: 17, fontWeight: "bold" }}> Your Location </Text>     
            </View>

            {/* four dots + driver to pick up duration */}
            <View style={[ styles.rowCenterContainer, {marginHorizontal: "3.5%"} ]}>
              <View style={[styles.dotsImage]}>
                <View style={{ width: "62%"}}>
                  <Text style={{ fontSize: 14, textAlign: "right" }}>{driverToPickupDuration} min</Text>
                </View>

                <View style={{ width: "40%", aspectRatio: 1, marginLeft: 4 }}>
                  <Image
                    source={require("@/assets/images/four-dots.png")}
                    style={[styles.requestPageImage]}
                  />
                </View>
              </View>
            </View>

            {/* Pickup location */}
            <View style={[ styles.rowCenterContainer, {paddingHorizontal: "15%"} ]}>
              <View style={{ width: "9%", aspectRatio: 1 }}>
                <Image
                  source={require("@/assets/images/rider-icon.png")}
                  style={[styles.requestPageImage]}
                />
              </View>

              <View style={{ width: "6%" }} />

              <View style={{ flexDirection: "column"}}>
                <Text style={{ fontSize: 17, fontWeight: "bold" }}>
                  {requestInfo.locationFrom?.name ?? "Pick Up"}
                </Text>
                <Text style={{ fontSize: 14.5}}>
                  {requestInfo.locationFrom?.address ?? "Pick Up Address"}
                </Text>
              </View>
            </View>

            {/* four dots + dropp off duration */}
            <View style={[ styles.rowCenterContainer, {marginHorizontal: "3.5%"} ]}>
              <View style={[styles.dotsImage, {paddingBottom: "2%"}]}>
                <View style={{ width: "62%"}}>
                  <Text style={{ fontSize: 14, textAlign: "right" }}>{pickupToDropoffDuration} min</Text>
                </View>

                <View style={{ width: "40%", aspectRatio: 1, marginLeft: 4 }}>
                  <Image
                    source={require("@/assets/images/four-dots.png")}
                    style={[styles.requestPageImage]}
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
                  style={[styles.requestPageImage]}
                />
              </View>
              
              <View style={{ width: "6%" }} />

              <View style={{ flexDirection: "column"}}>
                <Text style={{ fontSize: 17, fontWeight: "bold" }}>{requestInfo.locationTo?.name ?? "Drop Off"}</Text>
                <Text style={{ fontSize: 14.5 }}>{requestInfo.locationTo?.address ?? "Drop Off Address"}</Text>
              </View>
            </View>
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
              <Text style={[styles.buttonLabel]}>Let's Go!</Text>
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
            <Pressable
              style={[styles.bottomModalButton, styles.button]}
              onPress={handleAccept}
            >
              <Text style={[styles.buttonLabel]}>Accept</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
