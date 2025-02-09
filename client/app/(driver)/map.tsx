// import React, { useState } from "react";
import React, { useState, useEffect, useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { styles } from "@/assets/styles";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import { Alert, Linking } from "react-native";
import {
  DriverAcceptResponse,
  WebSocketResponse,
} from "../../../server/src/api";
import { LocationNames, LocationService } from "@/services/LocationService";

export default function App() {
  // INITIAL WEB SOCKET SETUP
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();
  // Use netid to pair this WebSocket connection with a netid
  WebSocketService.connect(netid as string, "DRIVER");

  // STATE VARIABLES
  // the drivers's location
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });
  // the pickup location
  const [pickUpLocation, setPickUpLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });
  // destination location
  const [dropOffLocation, setDropOffLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  // used for map zooming
  const mapRef = useRef<MapView>(null);

  // manage the currently accepted ride,
  const [rideInfo, setRideInfo] = React.useState<DriverAcceptResponse>({
    response: "ACCEPT_RIDE",
    netid: "",
    location: "",
    destination: "",
    numRiders: 0,
    requestid: "",
  });

  // STATE HOOKS
  useEffect(() => {
    // on the first render, get the user's location
    watchLocation();
    // and set up listeners
    WebSocketService.addListener(handleLocation, "LOCATION");
    WebSocketService.addListener(handleAccept, "ACCEPT_RIDE");
    WebSocketService.addListener(handleCompleteOrCancel, "CANCEL");
    WebSocketService.addListener(handleCompleteOrCancel, "COMPLETE");
  }, []);

  // when any of the locations change, zoom into the new locations and send info to the server
  useEffect(() => {
    if (rideInfo.netid != "") {
      // we are currently processing a ride
      // zoom to show the locations
      centerMapOnLocations([userLocation, pickUpLocation, dropOffLocation]);
      // send the changed driver info to the student
      WebSocketService.send({
        directive: "LOCATION",
        id: netid as string,
        latitude: 47.6599,
        longitude: -122.306,
      });

      WebSocketService.send({
        directive: "LOCATION",
        id: netid as string,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    } else {
      // if there is not active ride, follow the user
      centerMapOnLocations([userLocation]);
    }
  }, [userLocation, pickUpLocation, dropOffLocation, rideInfo]);

  /* FUNCTIONS */

  // FOLLOW THE USER'S LOCATION
  async function watchLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Please grant location permission");
      Alert.alert(
        "Location Permission Required",
        "You have denied location access. Please enable it in settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000, // Update every second
        distanceInterval: 1, // Update every meter
      },
      (location) => {
        // when location changes, change our state
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );
  }

  // ZOOM INTO GIVEN LOCATIONS
  const centerMapOnLocations = (
    locations: { latitude: number; longitude: number }[]
  ) => {
    mapRef?.current?.fitToCoordinates(locations, {
      edgePadding: { top: 100, right: 100, bottom: 50, left: 100 },
      animated: true,
    });
  };

  // TODO: MARK A SPECIFIC LOCTION OF THE STUDENT?

  // WEBSOCKET PLUMBING
  // listen for any LOCATION messages from the server
  const handleLocation = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "LOCATION") {
      console.log("LOCATION message received:", message);
    }
  };

  // Accept ride send and recieve messages
  // need to accept a ride to send locations
  const sendAccept = () => {
    WebSocketService.send({
      directive: "ACCEPT_RIDE",
      driverid: netid as string,
    });
  };
  const handleAccept = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "ACCEPT_RIDE") {
      const driverAccept = message as DriverAcceptResponse;
      // update state
      setRideInfo(driverAccept);
      setPickUpLocation(LocationService.getLatAndLong(driverAccept.location as LocationNames));
      setDropOffLocation(
        LocationService.getLatAndLong(driverAccept.destination as LocationNames)
      );
    }
  };

  // Cancel / Complete Ride send and recieve 
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

  // if the ride is completed or cancelled, reset the ride and our locations
  const handleCompleteOrCancel = (message: WebSocketResponse) => {
    if (
      "response" in message &&
      (message.response === "COMPLETE" || message.response === "CANCEL")
    ) {
      // reset the ride info
      setRideInfo({
        response: "ACCEPT_RIDE",
        netid: "",
        location: "",
        destination: "",
        numRiders: 0,
        requestid: "",
      });
      // reset locations
      setPickUpLocation({ latitude: 0, longitude: 0 });
      setDropOffLocation({ latitude: 0, longitude: 0 });
    }
  };

  // Map UI
  return (
    <View style={styles.mapContainer}>
      <SafeAreaProvider style={{ flex: 1 }} />
      <Header netid={netid as string} />
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude:
            userLocation.latitude != 0
              ? userLocation.latitude
              : 47.65462693267042,
          longitude:
            userLocation.longitude != 0
              ? userLocation.longitude
              : -122.30938853301136,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        {/* show the user's location*/}
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title={"userLocation"}
        />
        <Marker
          coordinate={{
            latitude: pickUpLocation.latitude,
            longitude: pickUpLocation.longitude,
          }}
          title={"pickUpLocation"}
        />
        <Marker
          coordinate={{
            latitude: dropOffLocation.latitude,
            longitude: dropOffLocation.longitude,
          }}
          title={"dropOffLocation"}
        />
      </MapView>
      {/* Temporary footer for accepting and completing rides*/}
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
