/* eslint-disable @typescript-eslint/no-require-imports */
import FAQ from "@/app/(student)/faq";
import { styles } from "@/assets/styles";
import React, { useState } from "react";
import {
  View,
  Image,
  Text,
  Pressable,
  Animated,
  TouchableOpacity,
} from "react-native";

interface RideConfirmCompProps {
  pickUpLoc: string;
  dropOffLoc: string;
  numPassengers: number;
  driverETA: number;
  onClose: () => void; // callback function for when the user closes modal
  onConfirm: (numPassengers: number) => void; // callback function for when the user confirms ride
}

const RideConfirmComp: React.FC<RideConfirmCompProps> = ({
  pickUpLoc,
  dropOffLoc,
  numPassengers,
  driverETA,
  onClose,
  onConfirm,
}) => {
  // FAQ State TODO: MOVE TO HOME PAGE
  const [FAQVisible, setFAQVisible] = useState(false);

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
      {/* Close Button */}
      <TouchableOpacity
        style={[
          styles.modalCloseButton,
          { position: "absolute", left: 10, top: 30, zIndex: 1 },
        ]}
        onPress={onClose}
      >
        <Image
          source={require("@/assets/images/confirm-back.png")}
          style={{ width: 58, height: 30 }}
        />
      </TouchableOpacity>
      <View style={{ height: 10 }} />

      <Text style={[styles.bottomModalTitle, { paddingBottom: 10 }]}>
        Confirm Your Ride
      </Text>
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

      {/* Number of Passengers */}
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <View style={{ flexDirection: "row", justifyContent: "center", padding: 10 }}>
          {Array.from({ length: numPassengers }).map((_, index) => (
            <Animated.View
              key={index}
              style={[styles.riderIcon, { marginLeft: index === 0 ? 0 : -29 }]} // Adjust overlap
            >
              <Image
                source={require("../assets/images/rider-icon.png")}
                style={{width: 20, 
                  height: 20,
                  resizeMode: "contain",}}
                resizeMode="contain"
              />
            </Animated.View>
          ))}
        </View>
        <Text style={{fontSize: 15}}>{numPassengers} passenger(s)</Text>
      </View>
      <View style={{ height: 20 }} />

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
          top: 247,
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
        <Image
          source={require("@/assets/images/faq-button.png")}
          style={{ width: 20, height: 20 }}
        />
      </TouchableOpacity>

      {/* faq pop-up modal */}
      <FAQ isVisible={FAQVisible} onClose={() => setFAQVisible(false)} />
    </View>
  );
};

export default RideConfirmComp;
