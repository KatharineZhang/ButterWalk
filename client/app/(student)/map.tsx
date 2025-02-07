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
import { LocationResponse, WebSocketResponse } from "../../../server/src/api";

export default function App() {
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();
  // Use netid to pair this WebSocket connection with a netid
  WebSocketService.connect(netid as string, "DRIVER");

  // the student's location
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  // the driver's location
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  // used for map zooming
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    // on the first render, get the user's location
    // and set up state
    WebSocketService.addListener(handleLocation, "LOCATION");
    WebSocketService.addListener(handleCompleteOrCancel, "COMPLETE");
    WebSocketService.addListener(handleCompleteOrCancel, "CANCEL");
    fetchUserLocation();
    watchLocation();
  }, []);

  useEffect(() => {
    console.log(
      "zoom to " +
        userLocation.latitude +
        ", " +
        userLocation.longitude +
        " and driver :" +
        driverLocation.latitude +
        ", " +
        driverLocation.longitude
    );
    if (driverLocation.latitude !== 0 && driverLocation.longitude !== 0) {
      // zoom to a combined region that fits both markers
      // add marker on the driver's location
      centerMapOnLocations([userLocation, driverLocation]);
    } else {
      // whenever userLocation changes, zoom into the new location
      centerMapOnLocations([userLocation]);
    }
  }, [userLocation, driverLocation]);

  /* FUNCTIONS */

  // SHOW THE USER'S LOCATION
  const fetchUserLocation = async () => {
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

  // WEBSOCKET PLUMBING
  // listen for any LOCATION messages from the server about the driver's location
  const handleLocation = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "LOCATION") {
      // update the marker on the driver's location from
      // (message as LocationResponse).latitude and (message as LocationResponse).longitude
      const driverResp = message as LocationResponse;
      setDriverLocation({
        latitude: driverResp.latitude,
        longitude: driverResp.longitude,
      });
    }
  };

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
  const sendCancel = () => {
    WebSocketService.send({
      directive: "CANCEL",
      netid: netid as string,
      role: "STUDENT",
    });
  };
  const handleCompleteOrCancel = (message: WebSocketResponse) => {
    if (
      "response" in message &&
      (message.response === "COMPLETE" || message.response === "CANCEL")
    ) {
      // reset the driver's location when the ride is done
      setDriverLocation({
        latitude: 0,
        longitude: 0,
      });
    }
  };

  return (
    //putting the map region on the screen
    <View>
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
        {/* show the user's location if they don't have default coordinate values */}
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title={"userLocation"}
        />
        {/* show the driver's location if they don't have default coordinate values //TODO: FIX*/}
        <Marker
          coordinate={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          }}
          title={"driverLocation"}
        />
      </MapView>
      {/* Temporary footer for requestig rides*/}
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
        <Pressable
          onPress={sendCancel}
          style={{ backgroundColor: "#4B2E83", padding: 10, borderRadius: 5 }}
        >
          <Text style={{ color: "white" }}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
