import React from "react";
import MapView from "react-native-maps";
import { View, Text, Pressable } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { styles } from "@/assets/styles";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import { Geolocation } from "@capacitor/Geolocation";
import { WebSocketResponse } from "../../../server/src/api";

// Home component with the <MapView> feature
// Currently defaults u to some spot between edmonds and kingston bc i was trying to figure out the coords to have it default to UW
// but it wouldnt work T^T (but at least its kind of close B))
export default function App() {
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();
  // Use netid to pair this WebSocket connection with a netid
  WebSocketService.connect(netid as string, "STUDENT");

  const requestPermissions = async () => {
    const status = await Geolocation.requestPermissions();
    console.log("Permission Status:", status);
  };

  requestPermissions();

  const getCurrentLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition();
      console.log("Latitude:", position.coords.latitude);
      console.log("Longitude:", position.coords.longitude);
    } catch (error) {
      console.error("Error getting location", error);
    }
  };

  getCurrentLocation();

  //to continuously check the driver's position update
  Geolocation.watchPosition({}, (position, err) => {
    if (position) {
      console.log("Updated Latitude:", position.coords.latitude);
      console.log("Updated Longitude:", position.coords.longitude);
      // update the student when the driver has accepted the ride
      WebSocketService.send({
        directive: "LOCATION",
        id: netid as string,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    }
    if (err) {
      console.error("Error watching position", err);
    }
  });

  // The important part
  // listen for any LOCATION messages from the server about the driver's location
  const handleLocation = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "LOCATION") {
      console.log("LOCATION message received:", message);
      // TODO: update the marker on the driver's location from
      // (message as LocationResponse).latitude and (message as LocationResponse).longitude
    }
  };
  WebSocketService.addListener(handleLocation, "LOCATION");

  const sendRequest = () => {
    WebSocketService.send({
      directive: "REQUEST_RIDE",
      phoneNum: "hi",
      netid: netid as string,
      location: "hi",
      destination: "hi",
      numRiders: 1,
    });
  };
  // end of important part

  return (
    <View style={styles.mapContainer}>
      <SafeAreaProvider style={{ flex: 1 }} />
      <Header netid={netid as string} />
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 47.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      ></MapView>
      {/* Temporary footer */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          padding: 20,
          backgroundColor: "#D1AE49",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Pressable
          onPress={sendRequest}
          style={{ backgroundColor: "#4B2E83", padding: 10, borderRadius: 5 }}
        >
          <Text style={{ color: "white" }}>Request Ride</Text>
        </Pressable>
      </View>
    </View>
  );
}
