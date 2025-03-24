/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { View, Image, Text, Pressable, TouchableOpacity } from "react-native";
import SegmentedProgressBar from "./SegmentedProgressBar";

interface ConfirmRideProps {
  pickUpLoc: string;
  dropOffLoc: string;
  numPassengers: number;
  rideDuration: number;
  walkDuration: number;
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
  walkDuration,
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
        height: "65%",
        padding: 10,
      }}
    >
      <View style={{ height: 20 }} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginHorizontal: 20,
        }}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={30} color="#4B2E83" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
          Confirm Your Ride
        </Text>

        {/* faq button */}
        <TouchableOpacity onPress={() => setFAQVisible(true)}>
          <Ionicons name="information-circle-outline" size={25} color="black" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
      <SegmentedProgressBar type={3} />
      <View style={{ height: 20 }} />

      {/* Duration Info */}
      <Text
        style={{
          marginLeft: 30,
          fontSize: 16,
          color: "#4b2e83",
          fontWeight: "bold",
          paddingBottom: 20,
        }}
      >
        Duration Information
      </Text>

      {/* Estimated Wait Time */}
      <View
        style={{
          marginHorizontal: 50,
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          paddingBottom: 20,
        }}
      >
        <Ionicons name="time-outline" size={22} color="black" />
        <View style={{ width: 10 }} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: 250,
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 16 }}>Estimated Wait Time</Text>

          <Text
            style={{
              fontStyle: "italic",
              fontSize: 16,
            }}
          >
            {driverETA == 0 ? "<2" : driverETA} min
          </Text>
        </View>
      </View>

      {/* Walking Duration */}
      <View
        style={{
          marginHorizontal: 50,
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          paddingBottom: 20,
        }}
      >
        <Ionicons name="walk" size={22} color="black" />
        <View style={{ width: 10 }} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: 250,
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 16 }}>Walking Duration</Text>

          <Text
            style={{
              fontStyle: "italic",
              fontSize: 16,
            }}
          >
            {walkDuration} min
          </Text>
        </View>
      </View>

      {/* Ride Duration */}
      <View
        style={{
          marginHorizontal: 50,
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          paddingBottom: 10,
        }}
      >
        <Ionicons name="car" size={22} color="black" />
        <View style={{ width: 10 }} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: 250,
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 16 }}>Ride Duration</Text>

          <Text
            style={{
              fontStyle: "italic",
              fontSize: 16,
            }}
          >
            {rideDuration} min
          </Text>
        </View>
      </View>

      <View style={{ height: 10 }} />

      {/* Location and Passenger Info */}
      <Text
        style={{
          marginLeft: 30,
          fontSize: 16,
          color: "#4b2e83",
          fontWeight: "bold",
          paddingBottom: 20,
        }}
      >
        Location and Passenger Information
      </Text>

      {/* Pickup Location */}
      <View
        style={{
          marginHorizontal: 55,
          flexDirection: "row",
          alignItems: "center",
          paddingBottom: 20,
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
        <View style={{ width: 30 }} />
        <Text style={{ fontSize: 16 }}>{pickUpLoc}</Text>
      </View>

      {/* Dropoff Location */}
      <View
        style={{
          marginHorizontal: 53,
          flexDirection: "row",
          alignItems: "center",
          paddingBottom: 20,
        }}
      >
        <Image
          source={require("@/assets/images/dropoff-location.png")}
          style={{ width: 20, height: 20, resizeMode: "contain" }}
        />
        <View style={{ width: 28 }} />
        <Text style={{ fontSize: 16 }}>{dropOffLoc}</Text>
      </View>

      {/* Number of Passengers */}
      <View
        style={{
          marginHorizontal: 52,
          flexDirection: "row",
          alignItems: "center",
          paddingBottom: 20,
        }}
      >
        <Image
          source={require("../assets/images/rider-icon.png")}
          style={{ width: 20, height: 20 }}
          resizeMode="contain"
        />

        <View style={{ width: 28 }} />
        <Text style={{ fontSize: 16 }}>{numPassengers} passenger(s)</Text>
      </View>

      {/* Dashed Line Between Locations */}
      <Image
        source={require("@/assets/images/dashed-line.png")}
        style={{
          position: "absolute",
          top: 329,
          left: 72,
          width: 2,
          height: 20,
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
    </View>
  );
};

export default ConfirmRide;
