//import WebSocketService from "@/services/WebSocketService";
//import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Button, Text, Pressable, StyleSheet, Animated } from "react-native";
import { WebSocketResponse } from "../../server/src/api";
import  Autocomplete from 'react-native-autocomplete-input';
import { Ionicons } from '@expo/vector-icons';
import { TextInput } from "react-native-gesture-handler";
import { Image } from "react-native";




export default function RideRequestForm() {
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();

  // Use netid to pair this WebSocket connection with a netid
  WebSocketService.connect(netid as string, "STUDENT");

  // user input states
  const [phoneNum, setPhoneNum] = useState("");
  const [location, setLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [numRiders, setNumRiders] = useState(1);
  const [message, setMessage] = useState("");
  const [rideConfirmed, setRideConfirmed] = useState(false);

  /* server stuff */
  // This function will be called whenever the server sends a message 
  const handleMessage = (message: WebSocketResponse) => {
    setMessage(JSON.stringify(message));
    //console.log(message);
  }
  // Add the listener to the WebSocketService
  WebSocketService.addListener(handleMessage, "REQUEST_RIDE");

  // Send form information to server
  const handleSend = () => {
    WebSocketService.send({ 
      directive: "REQUEST_RIDE", 
      phoneNum, 
      netid: Array.isArray(netid) ? netid[0] : netid,
      location, 
      destination, 
      numRiders });

      setRideConfirmed(true);
  }

  // flip from cancel ride to form view
  const handleCancelRide = () => {
    setRideConfirmed(false); 
  };

  /* Autocomplete search bar stuff */
  // Autocomplete for Location (this code needs to be simplified)
  const [locationQuery, setLocationQuery] = useState(""); // Location query
  const [locationHideResults, setLocationHideResults] = useState(true); // Location hideResults

  // Autocomplete for Destination
  const [destinationQuery, setDestinationQuery] = useState(""); // Destination query
  const [destinationHideResults, setDestinationHideResults] = useState(true);

  // data from figma
  const data = [
    'Alder Hall',
    'Communications Building',
    'Flagpole',
    'HUB',
    'Meany',
    'IMA',
    'Okanogan',
    'UW Tower',
  ];

  // Filtered data for location
  const filteredLocationData = data.filter((item) =>
    item.toLowerCase().includes(locationQuery.toLowerCase())
  );

  // Filtered data for destination
  const filteredDestinationData = data.filter((item) =>
    item.toLowerCase().includes(destinationQuery.toLowerCase())
  );

  // simplify code below
  // Handle location query text change
  const handleLocationChangeText = (text: string) => {
    setLocationQuery(text);
    setLocationHideResults(false); 
  };

  // Handle destination query text change
  const handleDestinationChangeText = (text: string) => {
    setDestinationQuery(text);
    setDestinationHideResults(false);
  };

  // Handle location input submission (press Enter)
  const handleLocationSubmitEditing = () => {
    setLocationHideResults(true);
    //console.log(locationQuery);
  };

  // Handle destination input submission (press Enter)
  const handleDestinationSubmitEditing = () => {
    setDestinationHideResults(true); 
    //console.log(destinationQuery);
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
  {rideConfirmed ? (
    <View>
      <Pressable onPress={handleCancelRide} style={styles.sendBttn}>
        <Text>Cancel Ride</Text>
      </Pressable>
    </View>
  ) : (
    <>
      <Text style={styles.header}>Request a Ride</Text>
      <View>
        <View style={styles.autocompleteContainer}>
          <Autocomplete 
            inputContainerStyle={styles.inputContainer}
            data={filteredLocationData}
            value={locationQuery}
            onChangeText={handleLocationChangeText}
            onSubmitEditing={handleLocationSubmitEditing}
            hideResults={locationHideResults}
            placeholder="Pick Up Location"
            placeholderTextColor="#888"
            flatListProps={{
              keyExtractor: (_, idx) => idx.toString(),
              renderItem: ({ item }) => (
                <Pressable
                  onPress={() => {
                    setLocationQuery(item);
                    setLocationHideResults(true);
                    setLocation(item);
                  }}
                  style={styles.dropdownItem}
                >
                  <Text>{item}</Text>
                </Pressable>
              ),
            }}
          />
        </View>

        <View style={styles.autocompleteContainer2}>
          <Autocomplete 
            inputContainerStyle={styles.inputContainer}
            data={filteredDestinationData}
            value={destinationQuery}
            onChangeText={handleDestinationChangeText}
            onSubmitEditing={handleDestinationSubmitEditing}
            hideResults={destinationHideResults}
            placeholder="Drop Off Location"
            flatListProps={{
              keyExtractor: (_, idx) => idx.toString(),
              renderItem: ({ item }) => (
                <Pressable
                  onPress={() => {
                    setDestinationQuery(item);
                    setDestinationHideResults(true);
                    setDestination(item);
                  }}
                  style={styles.dropdownItem}
                >
                  <Text>{item}</Text>
                </Pressable>
              ),
            }}
          />
        </View>
      </View>

      <View style={styles.animationContainer}>
        <View style={styles.riderContainer}>
          <View style={styles.iconRow}>
            {/* Minus Button also handls changes to numRiders state*/}
            <Pressable onPress={handleDecreaseRiders} style={styles.button}>
              <Ionicons name="remove" size={32} color="purple" />
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

            {/* handles the numRiders state */}
            <Pressable onPress={handleIncreaseRiders} style={styles.button}>
              <Ionicons name="add" size={32} color="purple" />
            </Pressable>
          </View>

          <Text style={styles.riderCount}>{numRiders} passenger(s)</Text>
        </View>
      </View>
      
      <Text style={styles.info}>
        If the wait is too long, check out the NightRide shuttle! The service is available 6:30 p.m. – 2 a.m. daily except University Holidays. Extended service runs until 3:30 a.m. the week before and the week of finals.
      </Text>
      
      {/*I am keeping the phone number field in for now so that it well send to websocket correctly*/}
      <TextInput 
        style={styles.phoneOption}
        placeholder="Phone Number"
        placeholderTextColor="#888"
        onChangeText={setPhoneNum}
        value={phoneNum}
      />
      
      <Pressable onPress={handleSend}>
        <Text style={styles.sendBttn}>Confirm Ride</Text>
      </Pressable>
    </>
  )}
</View>  

  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 15,
    width: "100%",
  },
  header : {
    fontSize: 20, 
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 30,
  },
  inputContainer: {
    borderRadius: 8, 
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderColor: "#4B2E83", 
    borderWidth: 2, 
    backgroundColor: "white", 
    overflow: "hidden"
  },
  autocompleteContainer: {
    position: "relative",
    zIndex: 100,
    paddingBottom: 10,
  },
  autocompleteContainer2: {
    position: "relative",
    zIndex: 1,
    paddingBottom: 10,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    position: "relative",
  },
  phoneOption: {
    height: 38,
    borderColor: "#B0B0B0",
    borderWidth: 1,
    color: "black",
    padding: 5,
    marginBottom: 10,
  },
  sendBttn: {
    position: "relative",
    marginTop: '20%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#4B2E83",
    borderRadius: 8,
    textAlign: "center",
    padding: 10,
    color: "white",
    fontSize: 16,
  },
  animationContainer: {
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "Black/Black 3",
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  riderContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  riderControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Centers horizontally
    marginVertical: 10,
  },
  riderCountContainer: {
    minWidth: 50, // Ensures consistent spacing
    alignItems: "center",
  },

  button: {
    padding: 10,
  },
  riderCount: {
    fontSize: 18,
    marginTop: 0, 
    marginBottom: 8,
    marginLeft: 5,
  },
  riderIconsContainer: {
    flexDirection: "row",
    position: "relative",
    height: 50, 
    marginRight: 20,
  },
  riderIcon: {
    position: "absolute",
    opacity: 1, 
  },
  riderImage: {
    width: 32, // Adjust based on your design
    height: 32,
    resizeMode: "contain",
  },
  info: {
    fontSize: 12,
    color: "#4B4C4F",
    fontWeight: 400,
    lineHeight: 16.34,
    fontFamily: "Open Sans",
    marginBottom: 40,

  },

})


// fuzzy search, autocomplete search bar, css styling, drawer slide up from bottom
// number of passengers UI, people incrementing decrementing with plus or minus
