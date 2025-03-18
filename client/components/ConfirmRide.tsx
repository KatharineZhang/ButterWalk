/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  View,
  Image,
  Text,
  Pressable,
  Animated,
  TouchableOpacity,
} from "react-native";

interface ConfirmRideProps {
  pickUpLoc: string;
  dropOffLoc: string;
  numPassengers: number;
  rideDuration: number;
  driverETA: number;
  onClose: () => void; // callback function for when the user closes modal
  onConfirm: (numPassengers: number) => void; // callback function for when the user confirms ride
  setFAQVisible: (visible: boolean) => void;
}

const ConfirmRide: React.FC<ConfirmRideProps> = ({
  pickUpLoc,
  dropOffLoc,
  numPassengers,
  rideDuration,
  driverETA,
  onClose,
  onConfirm,
  setFAQVisible,
}) => {
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
      <View style={{ height: 20 }} />
      {/* Back Button */}
      <TouchableOpacity
        style={[
          styles.modalCloseButton,
          { position: "absolute", left: 10, top: 30, zIndex: 1 },
        ]}
        onPress={onClose}
      >
        <Ionicons name="arrow-back" size={30} color="#4B2E83" />
      </TouchableOpacity>
      <View style={{ height: 10 }} />

      <Text style={[styles.bottomModalTitle, { paddingBottom: 10 }]}>
        Confirm Your Ride
      </Text>
      <View style={{ height: 10 }} />

      {/* Wait Time Display */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Ionicons name="time-outline" size={22} color="black" />
        <View style={{ width: 15 }} />
        <Text style={styles.waitTimeText}>
          Estimated Wait Time: {driverETA == 0 ? "<2" : driverETA} minutes
        </Text>
      </View>
      <Text style={{ textAlign: "center" }}>
        Ride Duration: {rideDuration} minutes
      </Text>
      <View style={{ height: 10 }} />

      {/* Number of Passengers */}
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            padding: 10,
          }}
        >
          {Array.from({ length: numPassengers }).map((_, index) => (
            <Animated.View
              key={index}
              style={[styles.riderIcon, { marginLeft: index === 0 ? 0 : -29 }]} // Adjust overlap
            >
              <Image
                source={require("../assets/images/rider-icon.png")}
                style={{ width: 20, height: 20, resizeMode: "contain" }}
                resizeMode="contain"
              />
            </Animated.View>
          ))}
        </View>
        <Text style={{ fontSize: 15 }}>{numPassengers} passenger(s)</Text>
      </View>
      <View style={{ height: 20 }} />

      {/* Pickup and DropOff Location */}
      <View style={styles.locationContainer}>
        <Image
          source={require("@/assets/images/pickup-location.png")}
          style={styles.locationImage}
        />
        <View style={styles.locationTextContainer}>
          <Text style={{ fontSize: 16 }}>{pickUpLoc}</Text>
        </View>
      </View>
      <View style={styles.locationContainer}>
        <Image
          source={require("@/assets/images/dropoff-location.png")}
          style={styles.locationImage}
        />
        <View style={styles.locationTextContainer}>
          <Text style={{ fontSize: 16 }}>{dropOffLoc}</Text>
        </View>
      </View>

      {/* Dashed Line Between Locations */}
      <Image
        source={require("@/assets/images/dashed-line.png")}
        style={{
          position: "absolute",
          top: 265,
          left: 44,
          width: 2,
          height: 30,
        }}
      />

      {/* Confirm Button */}
      <View style={styles.bottomModalButtonContainer}>
        <Pressable
          style={[styles.bottomModalButton, styles.confirmButton]}
          onPress={() => onConfirm(numPassengers)}
        >
          <Text style={styles.buttonText}>Confirm Ride</Text>
        </Pressable>
      </View>

      {/* faq button */}
      <TouchableOpacity
        style={{ position: "absolute", right: 30, top: 30 }}
        onPress={() => setFAQVisible(true)}
      >
        <Ionicons
          name="information-circle-outline"
          size={20}
          color="black"
          position="absolute"
          right={0}
        />
      </TouchableOpacity>
    </View>
  );
};

export default ConfirmRide;
