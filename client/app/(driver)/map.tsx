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
import { DriverAcceptResponse, WebSocketResponse } from "../../../server/src/api";

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
  // idealy should be at the top after the map stuff is finaliazed
  const [rideInfo, setRideInfo] = React.useState<DriverAcceptResponse>({
    response: "ACCEPT_RIDE",
    netid: "",
    location: "",
    destination: "",
    numRiders: 0,
    requestid: "",
  });

  // SHOW THE USER'S LOCATION
  // get permission to accass location of if permission is granted, get the user's location
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

    //print current user's location to console
    console.log("Location: ");
    console.log(currentLocation);
    // zoom into this location on map
    return {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };
  };

  useEffect(() => {
    // get and set our state to the location
    const fetchuserLocation = async () => {
      const location = await getPermissions();
      setUserLocation({
        latitude: location?.latitude ?? 0,
        longitude: location?.longitude ?? 0,
      });
    };
    fetchuserLocation();
    watchLocation();
    zoomIntoLocation();
  }, []);

  // Zoom into the user's current location TODO: HOW TO USE??
  const zoomIntoLocation = () => {
    mapRef?.current?.animateToRegion({
      latitude:
        userLocation.latitude != 0 ? userLocation.latitude : 47.65462693267042,
      longitude:
        userLocation.longitude != 0
          ? userLocation.longitude
          : -122.30938853301136,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
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
        console.log("LOCATION CHANGED: " + location.coords.latitude + ", " + location.coords.longitude);
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // send the location to the student
        if (rideInfo.netid != "") {
          // we are currently processing a ride
          console.log("Sending location to student with netid: " + rideInfo.netid);
          WebSocketService.send(
            {
              directive: "LOCATION",
              id: netid as string,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
        }
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
      setRideInfo(message as DriverAcceptResponse); // TODO: this doesnt refresh the UI???
      console.log(rideInfo);
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
