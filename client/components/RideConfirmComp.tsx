/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { View, Image, Text, Pressable, Animated, TouchableOpacity } from "react-native";

interface RideConfirmCompProps {
  pickUpLoc: string;
  dropOffLoc: string;
  driverETA: number;
  onClose: () => void; // callback function for when the user closes modal
  onConfirm: (numPassengers: number) => void; // callback function for when the user confirms ride
}

const RideConfirmComp: React.FC<RideConfirmCompProps> = ({
  pickUpLoc,
  dropOffLoc,
  driverETA,
  onClose,
  onConfirm,
}) => {
  const [numPassengers, setNumPassengers] = React.useState(1);

  // animation functions
  const fadeAnim = useState(new Animated.Value(0))[0];

  const animateRiders = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle increase/decrease of riders
  const handleIncreaseRiders = () => {
    if (numPassengers < 4) {
      setNumPassengers(numPassengers + 1);
      animateRiders();
    }
  };
  const handleDecreaseRiders = () => {
    if (numPassengers > 1) {
      setNumPassengers(numPassengers - 1);
      animateRiders();
    }
  };

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 10,
        position: "absolute",
        bottom: -10,
        width: "100%",
        height: "55%",
        padding: 10,
      }}
    >
      {/* Close Button */}
      <TouchableOpacity
        style={[
          styles.modalCloseButton,
          { position: "absolute", right: 10, top: 10, zIndex: 1 },
        ]}
        onPress={onClose}
      >
        <Image
          source={require("@/assets/images/modal-close.png")}
          style={{ width: 40, height: 40 }}
        />
      </TouchableOpacity>
      <View style={{ height: 10 }} />

      <Text style={styles.bottomModalTitle}>Confirm Ride Details</Text>
      <View style={{ height: 10 }} />

      {/* Wait Time Display */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Image
          source={require("@/assets/images/wait-time-clock.png")}
          style={{ width: 20, height: 20 }}
        />
        <View style={{ width: 15 }} />
        <Text style={styles.waitTimeText}>
          Estimated Wait Time: {driverETA} minutes
        </Text>
      </View>
      <View style={{ height: 10 }} />

      {/* Pickup and DropOff Location */}
      <View style={styles.locationContainer}>
        <Image
          source={require("@/assets/images/confirm-pickup-location.png")}
          style={styles.locationImage}
        />
        <View style={styles.locationTextContainer}>
          <Text style={{ fontSize: 16 }}>{pickUpLoc}</Text>
        </View>
      </View>
      <View style={styles.locationContainer}>
        <Image
          source={require("@/assets/images/confirm-dropoff-location.png")}
          style={styles.locationImage}
        />
        <View style={styles.locationTextContainer}>
          <Text style={{ fontSize: 16 }}>{dropOffLoc}</Text>
        </View>
      </View>

      {/* Dashed Line Between Locations */}
      <Image
        source={require("@/assets/images/confirm-line.png")}
        style={{
          position: "absolute",
          top: 140,
          left: 44,
          width: 2,
          height: 30,
        }}
      />

      {/* Number of Passengers */}
      <View style={styles.animationContainer}>
        <View style={styles.riderContainer}>
          <View style={styles.iconRow}>
            {/* Minus Button also handle changes to numPassengers state*/}
            <Pressable onPress={handleDecreaseRiders}>
              <Ionicons name="remove" size={32} color="#4B2E83" />
            </Pressable>

            {/* Rider Icons with verlapping effect seen in figma */}
            <View style={{ justifyContent: "center" }}>
              <View style={styles.riderIconsContainer}>
                {Array.from({ length: numPassengers }).map((_, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.riderIcon,
                      { marginLeft: index === 0 ? 0 : -20 },
                    ]} // Adjust overlap
                  >
                    <Image
                      source={require("../assets/images/rider-icon.png")}
                      style={styles.riderImage}
                      resizeMode="contain"
                    />
                  </Animated.View>
                ))}
              </View>
              <Text style={styles.riderCount}>
                {numPassengers} passenger(s)
              </Text>
            </View>
            {/* handles the numPassengers state */}
            <Pressable onPress={handleIncreaseRiders}>
              <Ionicons name="add" size={32} color="#4B2E83" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Confirm Button */}
      <View style={styles.bottomModalButtonContainer}>
        <Pressable
          style={[styles.bottomModalButton, styles.confirmButton]}
          onPress={() => onConfirm(numPassengers)}
        >
          <Text style={styles.buttonText}>Confirm Ride</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default RideConfirmComp;
