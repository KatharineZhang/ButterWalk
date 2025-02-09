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
  LocationResponse,
  WebSocketMessage,
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

  // STATE HOOKS
  useEffect(() => {
    // on the first render, get the user's location
    watchLocation();
    // and set up listeners
    WebSocketService.addListener(handleLocation, "LOCATION");
    WebSocketService.addListener(handleCompleteOrCancel, "COMPLETE");
    WebSocketService.addListener(handleCompleteOrCancel, "CANCEL");
  }, []);

  useEffect(() => {
    if (
      driverLocation.latitude !== 0 &&
      driverLocation.longitude !== 0 
    ) {
      // if driver location has been set, we have an accepted ride
      // assume that the pickup and dropoff locations have been set
      // zoom to see all markers
      centerMapOnLocations([
        userLocation,
        driverLocation,
        pickUpLocation,
        dropOffLocation,
      ]);
    } else if (pickUpLocation.latitude !== 0 && dropOffLocation.latitude !== 0) {
      // we have requested a ride that hasn't been accepted
      // zoom to see all markers
      centerMapOnLocations([userLocation, pickUpLocation, dropOffLocation]);
    } else {
      // if nothing else, whenever userLocation changes, zoom into the new location
      centerMapOnLocations([userLocation]);
    }
  }, [userLocation, driverLocation, pickUpLocation, dropOffLocation]);

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

  // CENTER MAP ON LOCATIONS
  const centerMapOnLocations = (
    locations: { latitude: number; longitude: number }[]
  ) => {
    mapRef?.current?.fitToCoordinates(locations, {
      edgePadding: { top: 100, right: 100, bottom: 50, left: 100 },
      animated: true,
    });
  };

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

  // send a request to the server for a ride
  const sendRequest = () => {
    const req: WebSocketMessage = {
      directive: "REQUEST_RIDE",
      phoneNum: "hi",
      netid: netid as string,
      location: "IMA",
      destination: "HUB",
      numRiders: 1,
    };
    WebSocketService.send(req);
    // set the pickup and dropoff locations to what we request
    setPickUpLocation(LocationService.getLatAndLong(req.location as LocationNames));
    setDropOffLocation(LocationService.getLatAndLong(req.destination as LocationNames));
  };

  // send a cancel message to the server
  const sendCancel = () => {
    WebSocketService.send({
      directive: "CANCEL",
      netid: netid as string,
      role: "STUDENT",
    });
  };

  // handle the case when the ride is completed or cancelled
  // reset the locations when the ride is done
  const handleCompleteOrCancel = (message: WebSocketResponse) => {
    if (
      "response" in message &&
      (message.response === "COMPLETE" || message.response === "CANCEL")
    ) {
      // reset ride locations when the ride is done
      setDriverLocation({
        latitude: 0,
        longitude: 0,
      });
      setPickUpLocation({
        latitude: 0,
        longitude: 0,
      });
      setDropOffLocation({
        latitude: 0,
        longitude: 0,
      });

    }
  };

  // Map UI
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
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title={"userLocation"}
        />
        <Marker
          coordinate={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          }}
          title={"driverLocation"}
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
      {/* Temporary footer for requesting rides*/}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          padding: 20,
          backgroundColor: "#D1AE49",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: "row",
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
