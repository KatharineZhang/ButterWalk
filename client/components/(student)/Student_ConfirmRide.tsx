/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  View,
  Image,
  Text,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import SegmentedProgressBar from "../SegmentedProgressBar";

interface ConfirmRideProps {
  pickUpLoc: string;
  dropOffLoc: string;
  numPassengers: number;
  rideDuration: number;
  walkDuration: number;
  driverETA: number;
  onClose: () => void; // callback function for when the user closes modal
  onConfirm: (numPassengers: number) => void; // callback function for when the user confirms ride
  setFAQVisible: (visible: boolean) => void; // callback function to set the visibility of the FAQ modal
  updateSideBarHeight: (height: number) => void; // callback function to update the height of the sidebar
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
  updateSideBarHeight,
}) => {
  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 10,
        position: "absolute",
        bottom: 0,
        width: "100%",
        maxHeight: "90%",
        padding: "2%",
      }}
      onLayout={(event) => {
        // on render, update the sidebar height to the height of this component
        updateSideBarHeight(event.nativeEvent.layout.height);
      }}
    >
      <View style={{ height: "1%" }} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginHorizontal: "5%",
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
      <View style={{ height: "3%" }} />
      <SegmentedProgressBar type={3} />
      <View style={{ height: "2%" }} />
      {/* Duration Info */}
      <Text style={styles.confirmHeader}>Duration Information</Text>

      {/* Estimated Wait Time */}
      <View
        style={{
          marginHorizontal: "13%",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          paddingBottom: "5%",
        }}
      >
        <Ionicons name="time-outline" size={22} color="black" />
        <View style={{ width: "2%" }} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "95%",
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
          marginHorizontal: "13%",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          paddingBottom: "5%",
        }}
      >
        <Ionicons name="walk" size={22} color="black" />
        <View style={{ width: "2%" }} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "95%",
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
          marginHorizontal: "13%",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          paddingBottom: "5%",
        }}
      >
        <Ionicons name="car" size={22} color="black" />
        <View style={{ width: "2%" }} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "95%",
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

      {/* Location and Passenger Info */}
      <Text style={styles.confirmHeader}>
        Location and Passenger Information
      </Text>

      {/* Pickup Location */}
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
        <Text style={{ fontSize: 16 }}>{pickUpLoc}</Text>
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
        <Text style={{ fontSize: 16 }}>{dropOffLoc}</Text>
      </View>

      {/* Number of Passengers */}
      <View
        style={{
          marginHorizontal: "13%",
          flexDirection: "row",
          alignItems: "center",
          paddingBottom: "2.5%",
        }}
      >
        <Image
          source={require("../assets/images/rider-icon.png")}
          style={{ width: 20, height: 20 }}
          resizeMode="contain"
        />

        <View style={{ width: "6.5%" }} />
        <Text style={{ fontSize: 16 }}>{numPassengers} passenger(s)</Text>
      </View>

      {/* Confirm Button */}
      <View style={styles.bottomModalButtonContainer}>
        <Pressable
          style={[styles.bottomModalButton, styles.confirmButton]}
          onPress={() => onConfirm(numPassengers)}
        >
          <Text
            style={{
              color: "#4B2E83",
              fontSize: 18,
            }}
          >
            Confirm Ride
          </Text>
        </Pressable>
      </View>
      <View style={{ height: useWindowDimensions().height * 0.05 }} />
    </View>
  );
};

export default ConfirmRide;
