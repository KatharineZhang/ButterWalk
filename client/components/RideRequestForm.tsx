/* eslint-disable @typescript-eslint/no-require-imports */
import WebSocketService from "@/services/WebSocketService";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  TouchableOpacity,
} from "react-native";
import { ErrorResponse, WebSocketResponse } from "../../server/src/api";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import AutocompleteInput from "./AutocompleteInput";
import { LocationNames } from "../services/LocationService";
import { styles } from "../assets/styles";
import BottomDrawer from "./BottomDrawer";
import FAQ from "@/app/(student)/faq";

// What's in this component:
// Ride Request Form which sends request to server and gets response back,
// Cancel Ride button to cancel ride request,
// fuzzy search for location and desination which uses autocomplete(buggy),
// animation for rider icons,
// This is a beefy component!

export default function RideRequestForm() {
  // connect to websocket
  const { netid } = useLocalSearchParams();

  // user input states for form
  const [location, setLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [numRiders, setNumRiders] = useState(1);
  const [message, setMessage] = useState("");

  // FAQ State
  const [FAQVisible, setFAQVisible] = useState(false);

  // true if ride request is accepted by server
  const [accepted, setAccepted] = useState(false);

  /* SERVER STUFF START */

  // This function will be called whenever the server sends a message for REQUEST_RIDE
  const handleMessage = (message: WebSocketResponse) => {
    // Ride will only accepted if we get a successful response from server
    if ("response" in message && message.response === "REQUEST_RIDE") {
      console.log(message);
      setAccepted(true);
      setMessage(""); // clear error message
    } else {
      // something went wrong
      setMessage((message as ErrorResponse).error);
    }
  };
  // send ride request to server
  const handleSend = () => {
    if (location == "" || destination == "") {
      setMessage("Please specify a pickup and dropoff location!");
      return;
    }
    WebSocketService.send({
      directive: "REQUEST_RIDE",
      phoneNum: "111-111-1111", // TODO: GET PHONE NUMBER HERE SOMEHOW
      netid: Array.isArray(netid) ? netid[0] : netid,
      location,
      destination,
      numRiders,
    });
  };

  // This function will be called whenever the server sends a message for CANCEL RIDE
  const handleCancelMessage = (message: WebSocketResponse) => {
    // If cancellation was successful (server gave correct response), set accepted to false
    if ("response" in message && message.response === "CANCEL") {
      setAccepted(false);
    } else {
      alert("Failed to cancel ride. Please try again.");
    }
  };
  // Send cancel request to server
  const sendCancel = () => {
    WebSocketService.send({
      directive: "CANCEL",
      netid: netid as string,
      role: "STUDENT",
    });
  };

  // add listeners for REQUEST_RIDE and CANCEL to call handle functions
  useEffect(() => {
    WebSocketService.addListener(handleMessage, "REQUEST_RIDE");
    WebSocketService.addListener(handleCancelMessage, "CANCEL");
    return () => {
      WebSocketService.removeListener(handleMessage, "REQUEST_RIDE");
      WebSocketService.removeListener(handleCancelMessage, "CANCEL");
    };
  }, []);

  /* SERVER STUFF ENDS HERE */

  /* FUZZY SEARCH BAR STUFF */

  // Autocomplete for Location and Destination
  const [locationQuery, setLocationQuery] = useState(""); // Location query
  const [destinationQuery, setDestinationQuery] = useState(""); // Destination query

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

  // check that does not allow location and destination to be the same
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

  /* FUZZY SEARCH BAR STUFF ENDS HERE */

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
    <BottomDrawer>
      <View style={styles.formContainer}>
        {/* If ride is accepted show cancel button, else show ride request form */}
        {accepted ? (
          <>
            <Text style={styles.formHeader}>Ride Request Accepted</Text>
            <Pressable onPress={sendCancel} style={styles.sendButton}>
              <Text style={styles.buttonLabel}>Cancel Ride</Text>
            </Pressable>
          </>
        ) : (
          <View>
            <Text style={styles.formHeader}>Request a Ride</Text>
            <View>
              {/* Location and Destination Autocomplete */}
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

            {/* Rider Selection Animation */}
            <View style={styles.animationContainer}>
              <View style={styles.riderContainer}>
                <View style={styles.iconRow}>
                  {/* Decrease Riders */}
                  <Pressable
                    onPress={handleDecreaseRiders}
                    style={styles.clearButton}
                  >
                    <Ionicons name="remove" size={32} color="#4B2E83" />
                  </Pressable>

                  {/* Rider Icons */}
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

                  {/* Increase Riders */}
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

            {/* Information Text */}
            <Text style={styles.infoText}>
              If the wait is too long, check out the NightRide shuttle! The
              service is available 6:30 p.m. – 2 a.m. daily except University
              Holidays. Extended service runs until 3:30 a.m. the week before
              and the week of finals.
            </Text>

            <Text style={{ color: "red" }}>{message}</Text>

            {/* Confirm Ride Button */}
            <Pressable onPress={handleSend} style={styles.sendButton}>
              <Text style={styles.buttonLabel}>Confirm Ride</Text>
            </Pressable>

            {/* faq button */}
            <TouchableOpacity
              style={{ position: "absolute", right: 10, top: 0 }}
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
        )}
      </View>
    </BottomDrawer>
  );
}
