import MapView from "react-native-maps";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { styles } from "@/assets/styles";
import { Pressable, View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import { Geolocation } from "@capacitor/Geolocation";
import {
  DriverAcceptResponse,
  WebSocketResponse,
} from "../../../server/src/api";
import React from "react";

//right now the map shows but the console just has errors - i'm trying to get location
//before i show the map so that I can route directions from their location
//i think this is going to require getting the location before going to the map page
//TBD when I get it (pros and cons to each)
export default function App() {
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();
  // Use netid to pair this WebSocket connection with a netid
  WebSocketService.connect(netid as string, "DRIVER");

  // TODO: I nuked all the previous code, and replaced it with the code Parshvi gave me
  // replace this as necessary
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

      if (rideInfo.requestid) {
        // if we have accepted a ride, we have someone to send this information to
        WebSocketService.send({
          directive: "LOCATION",
          id: netid as string,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }
    }
    if (err) {
      console.error("Error watching position", err);
    }
  });

  // The important part
  // temporary state to manage the currently accepted ride,
  // idealy should be at the top after the map stuff is finaliazed
  const [rideInfo, setRideInfo] = React.useState<DriverAcceptResponse>({
    response: "ACCEPT_RIDE",
    netid: "",
    location: "",
    destination: "",
    numRiders: 0,
    requestid: "",
  });

  // listen for any LOCATION messages from the server
  const handleLocation = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "LOCATION") {
      console.log("LOCATION message received:", message);
    }
  };
  WebSocketService.addListener(handleLocation, "LOCATION");

  // need to accept a ride to send locations
  const sendAccept = () => {
    WebSocketService.send({
      directive: "ACCEPT_RIDE",
      driverid: netid as string,
    });
  };
  const handleAccept = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "ACCEPT_RIDE") {
      setRideInfo(message as DriverAcceptResponse);
    }
  };
  WebSocketService.addListener(handleAccept, "ACCEPT_RIDE");

  // bonus. since we accepted rides, we might as well complete them
  // currently there are no listeners on these routes
  // because we don't need then right now!
  const sendCancel = () => {
    WebSocketService.send({
      directive: "CANCEL",
      netid: netid as string,
      role: "DRIVER",
    });
  };

  const sendComplete = () => {
    WebSocketService.send({
      directive: "COMPLETE",
      requestid: rideInfo.requestid,
    });
  };
  // end of the important part

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
        {/* temporary buttons */}
        <Text>Ride Info: {JSON.stringify(rideInfo)}</Text>
        <Pressable
          onPress={sendAccept}
          style={{ backgroundColor: "#4B2E83", padding: 10, borderRadius: 5 }}
        >
          <Text style={{ color: "white" }}>Accept</Text>
        </Pressable>
        <Pressable
          onPress={sendCancel}
          style={{ backgroundColor: "#4B2E83", padding: 10, borderRadius: 5 }}
        >
          <Text style={{ color: "white" }}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={sendComplete}
          style={{ backgroundColor: "#4B2E83", padding: 10, borderRadius: 5 }}
        >
          <Text style={{ color: "white" }}>Complete</Text>
        </Pressable>
      </View>
    </View>
  );
}
