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

export default function App() {
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();
  // Use netid to pair this WebSocket connection with a netid
  WebSocketService.connect(netid as string, "DRIVER");

  // the drivers's location
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  // used for map zooming
  const mapRef = useRef<MapView>(null);

  // temporary state to manage the currently accepted ride,
  const [rideInfo, setRideInfo] = React.useState<DriverAcceptResponse>({
    response: "ACCEPT_RIDE",
    netid: "",
    location: "",
    destination: "",
    numRiders: 0,
    requestid: "",
  });

  useEffect(() => {
    // on the first render, get the user's location
    // and set up state
    WebSocketService.addListener(handleLocation, "LOCATION");
    WebSocketService.addListener(handleAccept, "ACCEPT_RIDE");
    fetchuserLocation();
    watchLocation();
  }, []);

  useEffect(() => {
    // whenever userLocation changes, zoom into the new location
    centerMapOnLocations([userLocation]);

    // send the location to the student
    if (rideInfo.netid != "") {
      // we are currently processing a ride
      // send the changed driver info to the student
      WebSocketService.send({
        directive: "LOCATION",
        id: netid as string,
        latitude: 47.6599,
        longitude: -122.306,
      });
    }
  }, [userLocation, rideInfo]);

  /* FUNCTIONS */

  // SHOW THE USER'S LOCATION
  const fetchuserLocation = async () => {
    const location = await getPermissions();
    console.log(
      "FETCHING LOCATION: " + location?.latitude + ", " + location?.longitude
    );
    setUserLocation({
      latitude: location?.latitude ?? 0,
      longitude: location?.longitude ?? 0,
    });
  };

  // HELPER: GET PERMISSIONS FOR ACCESSING LOCATION
  const getPermissions = async () => {
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
    const currentLocation = await Location.getCurrentPositionAsync({});

    return {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };
  };

  // ZOOM INTO GIVEN LOCATIONS
  const centerMapOnLocations = (
    locations: { latitude: number; longitude: number }[]
  ) => {
    mapRef?.current?.fitToCoordinates(locations, {
      edgePadding: { top: 100, right: 100, bottom: 50, left: 100 },
      animated: true,
    });
  };

  // WATCH POSITION
  async function watchLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission to access location was denied");
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

  // TODO: MARK A SPECIFIC LOCTION OF THE STUDENT?

  // WEBSOCKET PLUMBING
  // listen for any LOCATION messages from the server
  const handleLocation = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "LOCATION") {
      console.log("LOCATION message received:", message);
    }
  };

  // need to accept a ride to send locations
  const sendAccept = () => {
    WebSocketService.send({
      directive: "ACCEPT_RIDE",
      driverid: netid as string,
    });
  };
  const handleAccept = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "ACCEPT_RIDE") {
      setRideInfo(message as DriverAcceptResponse); // TODO: this doesnt refresh the UI???
      console.log(rideInfo);
    }
  };

  // bonus. since we accepted rides, we might as well complete them
  // currently there are no listeners on these routes
  // because we don't need then right now!
  const sendCancel = () => {
    WebSocketService.send({
      directive: "CANCEL",
      netid: netid as string,
      role: "DRIVER",
    });
    // reset the ride info
    // technically we should wait for a response from the server
    // but this is just for testing
    setRideInfo({
      response: "ACCEPT_RIDE",
      netid: "",
      location: "",
      destination: "",
      numRiders: 0,
      requestid: "",
    });
  };

  const sendComplete = () => {
    WebSocketService.send({
      directive: "COMPLETE",
      requestid: rideInfo.requestid,
    });
    // reset the ride info
    // technically we should wait for a response from the server
    // but this is just for testing
    setRideInfo({
      response: "ACCEPT_RIDE",
      netid: "",
      location: "",
      destination: "",
      numRiders: 0,
      requestid: "",
    });
  };

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
