/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { View, Text, Animated, Image } from "react-native";
import { loadingPageCompStyles, styles } from "../assets/styles";
import { Ionicons } from "@expo/vector-icons";
import LoadingDots from "./LoadingDots";

interface loadingPageCompProps {
  pickUpLoc: string;
  dropOffLoc: string;
  numPassengers: number;
}

const LoadingPageComp: React.FC<loadingPageCompProps> = ({
  pickUpLoc,
  dropOffLoc,
  numPassengers,
}) => {
  return (
    <View style={loadingPageCompStyles.rootContainer}>
      <View style={{ height: 90 }} />
      {/* Top Progress Bar */}
      <View
        style={{
          width: "100%",
          alignContent: "center",
        }}
      >
        {/* Yellow Progress Bar */}
        <View
          style={{
            height: 8,
            width: "100%",
            backgroundColor: "#DBCEAC",
          }}
        >
          <Text> </Text>
        </View>
        {/* pickup circle */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 50,
            position: "absolute",
            height: 25,
            width: 25,
            left: -2,
            top: -10,
            transform: [{ rotate: "45deg" }],
          }}
        >
          <Ionicons name="navigate-circle" size={25} color="black" />
        </View>

        {/* destination circle */}
        <View
          style={{
            width: 25,
            height: 25,
            borderRadius: 50,
            backgroundColor: "#8E632A",
            borderWidth: 1,
            borderColor: "white",
            position: "absolute",
            right: -2,
            top: -10,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              borderRadius: 50,
              height: 7,
              width: 7,
              backgroundColor: "white",
            }}
          />
        </View>
      </View>
      <View style={{ height:20 }} />

      {/* Locations Display */}
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 10,
        }}
      >
        <View style={{ alignItems: "flex-start" }}>
          <Text style={loadingPageCompStyles.locationMainTextTypography}>
            Pickup
          </Text>
          <View style={{ height: 5 }} />
          <Text style={loadingPageCompStyles.locationSubTextTypography}>
            {pickUpLoc}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={loadingPageCompStyles.locationMainTextTypography}>
            Dropoff
          </Text>
          <View style={{ height: 5 }} />
          <Text style={loadingPageCompStyles.locationSubTextTypography}>
            {dropOffLoc}
          </Text>
        </View>
      </View>

      {/* Rider Icons */}
      <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            left: "42%",
            top: 50,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              paddingBottom: 5,
            }}
          >
            {Array.from({ length: numPassengers }).map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.riderIcon,
                  { marginLeft: index === 0 ? 0 : -35 },
                ]} // Adjust overlap
              >
                <Image
                  source={require("../assets/images/rider-icon-white.png")}
                  style={{ width: 25, height: 25, resizeMode: "contain" }}
                  resizeMode="contain"
                />
              </Animated.View>
            ))}
          </View>
          <Text style={{ fontSize: 14, color: "white" }}>
            {numPassengers} passenger(s)
          </Text>
        </View>

      {/* Middle Display */}
      <View style={loadingPageCompStyles.middleDisplayContainer}>
        <View>
          <Text style={loadingPageCompStyles.mainTextTypography}>
            Requesting a Ride
          </Text>
        </View>
        <View style={{ height: 10 }} />
        <View>
          <Text style={loadingPageCompStyles.subtextTypography}>
            This could take a few minutes. Do NOT exit out of the app.
          </Text>
        </View>
        <View style={{ height: 40 }} />
        {/* Loading Animation */}
        < View style={{width: 80}}>
        <LoadingDots/>
          </View>
      </View>
    </View>
  );
};

export default LoadingPageComp;
