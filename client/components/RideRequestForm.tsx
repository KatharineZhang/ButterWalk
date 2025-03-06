import WebSocketService from "@/services/WebSocketService";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { CancelResponse, WebSocketResponse } from "../../server/src/api";
import Autocomplete from "react-native-autocomplete-input";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import AutocompleteInput from "./AutocompleteInput";
import { LocationNames } from "../services/LocationService";
import LoadingPage from "./LoadingPage";
import { router } from "expo-router";
import { styles } from "../assets/styles";

// Ride Request Form which sends request to server and gets response back,
// fuzzy search for location and desination which uses autocomplete,
// animation for rider icons, and a cancel button to cancel ride request
// This is a beefy component!

export default function RideRequestForm() {
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();

  // Use netid to pair this WebSocket connection with a netid
  WebSocketService.connect(netid as string, "STUDENT");

  // user input states
  const [location, setLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [numRiders, setNumRiders] = useState(1);
  const [message, setMessage] = useState("");
  const [rideConfirmed, setRideConfirmed] = useState(false);

  /* server stuff */
  // This function will be called whenever the server sends a message
  // if we get a response, set isLoading to false and rideConfirmed to true
  const handleMessage = (message: WebSocketResponse) => {
    setMessage(JSON.stringify(message));
    setRideConfirmed(true);
    router.back();
  };

  // Add a new message handler specifically for cancel responses
  const handleCancelMessage = (message: WebSocketResponse) => {
    if ("info" in message && message.response === "CANCEL") {
      setRideConfirmed(false);
      router.back();
    } else {
      alert("Failed to cancel ride. Please try again.");
    }
  };

  // Add the cancel listener to WebSocketService
  useEffect(() => {
    WebSocketService.addListener(handleMessage, "REQUEST_RIDE");
    WebSocketService.addListener(handleCancelMessage, "CANCEL");

    // Cleanup listeners on unmount
    return () => {
      WebSocketService.removeListener(handleMessage, "REQUEST_RIDE");
      WebSocketService.removeListener(handleCancelMessage, "CANCEL");
    };
  }, []);

  // Send form information to server
  const handleSend = () => {
    router.push("/loading");
    WebSocketService.send({
      directive: "REQUEST_RIDE",
      phoneNum: "111-111-1111", // TODO: GET PHONE NUMBER HERE SOMEHOW
      netid: Array.isArray(netid) ? netid[0] : netid, // weird stuff to avoide typescript error
      location,
      destination,
      numRiders,
    });

    // when server sends back a response, set rideConfirmed to true
    if (message !== "") {
      setRideConfirmed(true);
    }
  };

  // flip from cancel ride to form view
  const sendCancel = () => {
    WebSocketService.send({
      directive: "CANCEL",
      netid: netid as string,
      role: "STUDENT",
    });
    setRideConfirmed(false);
  };

  /* Autocomplete search bar stuff */
  // Autocomplete for Location (this code needs to be simplified)
  const [locationQuery, setLocationQuery] = useState(""); // Location query
  //const [locationHideResults, setLocationHideResults] = useState(true);

  // Autocomplete for Destination
  const [destinationQuery, setDestinationQuery] = useState(""); // Destination query
  // const [destinationHideResults, setDestinationHideResults] = useState(true);

  // data from LocationService.ts
  const data: LocationNames[] = [
    "HUB",
    "Alder Hall",
    "Communication Building",
    "Flagpole",
    "Meany Hall",
    "IMA",
    "Okanogan Lane",
    "UW Tower",
  ];

  /* Fuzzy search stuffs */
  const handleSetLocation = (value: string) => {
    if (value === destination) {
      alert("Pickup location and destination cannot be the same!");
      return;
    }
    setLocation(value);
  };

  const handleSetDestination = (value: string) => {
    if (value === location) {
      alert("Pickup location and destination cannot be the same!");
      return;
    }
    setDestination(value);
  };

  /* Animation stuffs */
  const fadeAnim = useState(new Animated.Value(0))[0];

  // animation functions
  const animateRiders = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle increase/decrease of riders
  const handleIncreaseRiders = () => {
    if (numRiders < 4) {
      setNumRiders(numRiders + 1);
      animateRiders();
    }
  };
  const handleDecreaseRiders = () => {
    if (numRiders > 1) {
      setNumRiders(numRiders - 1);
      animateRiders();
    }
  };

  return (
    <View style={styles.formContainer}>
      {/* Show Ride Request Form, or loading page, orcancel ride button */}
      {rideConfirmed ? (
        <View>
          <Pressable onPress={sendCancel} style={styles.sendButton}>
            <Text style={styles.cancelText}>Cancel Ride</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.formHeader}>Request a Ride</Text>
          <View>
            <View style={{ zIndex: 2 }}>
              <AutocompleteInput
                query={locationQuery}
                setQuery={setLocationQuery}
                setSelection={handleSetLocation}
                placeholder="Pick Up Location"
                data={data}
              />
            </View>

            <View style={{ zIndex: 1 }}>
              <AutocompleteInput
                query={destinationQuery}
                setQuery={setDestinationQuery}
                setSelection={handleSetDestination}
                placeholder="Drop Off Location"
                data={data}
              />
            </View>
          </View>

          <View style={styles.animationContainer}>
            <View style={styles.riderContainer}>
              <View style={styles.iconRow}>
                {/* Minus Button also handls changes to numRiders state*/}
                <Pressable
                  onPress={handleDecreaseRiders}
                  style={styles.clearButton}
                >
                  <Ionicons name="remove" size={32} color="#4B2E83" />
                </Pressable>

                {/* Rider Icons with verlapping effect seen in figma */}
                <View style={styles.riderIconsContainer}>
                  {Array.from({ length: numRiders }).map((_, index) => (
                    <Animated.View
                      key={index}
                      style={[styles.riderIcon, { left: index * -10 }]} // Adjust overlap
                    >
                      <Image
                        source={require("../assets/images/rider-icon.png")}
                        style={styles.riderImage}
                        resizeMode="contain"
                      />
                    </Animated.View>
                  ))}
                </View>

                {/* handles the numRiders state, increases numRiders by 1 */}
                <Pressable
                  onPress={handleIncreaseRiders}
                  style={styles.clearButton}
                >
                  <Ionicons name="add" size={32} color="#4B2E83" />
                </Pressable>
              </View>

              <Text style={styles.riderCount}>{numRiders} passenger(s)</Text>
            </View>
          </View>

          <Text style={styles.infoText}>
            If the wait is too long, check out the NightRide shuttle! The
            service is available 6:30 p.m. – 2 a.m. daily except University
            Holidays. Extended service runs until 3:30 a.m. the week before and
            the week of finals.
          </Text>

          {/* waits for getting a response back from server to show cancel button */}
          <Pressable onPress={handleSend} style={styles.sendButton}>
            <Text style={styles.buttonLabel}>Confirm Ride</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
