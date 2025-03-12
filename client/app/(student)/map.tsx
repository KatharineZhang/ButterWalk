/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useState, useEffect, useRef } from "react";
import MapView, { Polygon, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { styles } from "@/assets/styles";
import { View, TouchableOpacity, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import RideRequestForm from "@/components/RideRequestForm";

// file changes to test ride request form!
import { Alert, Linking } from "react-native";
import { LocationResponse, WebSocketResponse } from "../../../server/src/api";
import MapViewDirections from "react-native-maps-directions";
import Profile from "./profile";

export default function App() {
  // INITIAL WEB SOCKET SETUP
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();

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
  const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
    ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
    : "";

  // Profile State
  const [profileVisible, setProfileVisible] = useState(false);

  // control where we want to zoom on the map
  // in the format: [userLocation, driverLocation, pickUpLocation, dropOffLocation]
  const [zoomOn, setZoomOn] = useState<
    { latitude: number; longitude: number }[]
  >([
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0 },
  ]);

  // used for map zooming
  const mapRef = useRef<MapView>(null);

  // STATE HOOKS
  useEffect(() => {
    // on the first render, get the user's location
    // and set up listeners
    watchLocation();
    WebSocketService.addListener(handleLocation, "LOCATION");
    WebSocketService.addListener(handleCompleteOrCancel, "COMPLETE");
    WebSocketService.addListener(handleCompleteOrCancel, "CANCEL");
    WebSocketService.addListener(handleRequest, "REQUEST_RIDE");
  }, []);

  useEffect(() => {
    // when any of our locations change, check if we need to zoom on them
    // we only want to update the zoom if a drastic change was made (distance > 10),
    // i.e. the driver, pickup and dropoff locations were set to valid values,
    // or they where set back to invalid values (0,0)
    // only update zoomOn in these cases to allow the user more flexibility to
    // move the map without being forced into a zoomed view
    const diff0 = calculateDistance(userLocation, zoomOn[0]);
    const diff1 = calculateDistance(driverLocation, zoomOn[1]);
    const diff2 = calculateDistance(pickUpLocation, zoomOn[2]);
    const diff3 = calculateDistance(dropOffLocation, zoomOn[3]);

    // check zoomOn index 0 aka userLocation
    if (diff0 > 10) {
      console.log("updating user location", userLocation);
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[0] = userLocation;
        return newZoomOn;
      });
    }

    // check zoomOn index 1 aka driverLocation
    if (diff1 > 10) {
      console.log("updating driver location", driverLocation);
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[1] = driverLocation;
        return newZoomOn;
      });
    }

    // check zoomOn index 2 aka pickUpLocation
    if (diff2 > 10) {
      console.log("updating pickup location", pickUpLocation);
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[2] = pickUpLocation;
        return newZoomOn;
      });
    }

    // check zoomOn index 3 aka dropOffLocation
    if (diff3 > 10) {
      console.log("updating dropoff location", dropOffLocation);
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[3] = dropOffLocation;
        return newZoomOn;
      });
    }
  }, [userLocation, driverLocation, pickUpLocation, dropOffLocation]);

  useEffect(() => {
    // when we change what we want to zoom on, zoom on it
    centerMapOnLocations(zoomOn);
  }, [zoomOn]);

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
    // filter out any locations that are 0,0
    locations = locations.filter(
      (loc) => loc.latitude != 0 && loc.longitude != 0
    );
    console.log("ZOOMING TO LOCATIONS:", locations);
    mapRef?.current?.fitToCoordinates(locations, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  // HELPER FOR USE EFFECT: calculate the distance between two points to check if we should update the zoomOn state
  const calculateDistance = (
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ) => {
    return Math.sqrt(
      Math.pow(point1.latitude - point2.latitude, 2) +
        Math.pow(point1.longitude - point2.longitude, 2)
    );
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

  const handleRequest = (message: WebSocketResponse) => {
    // since we already set the pickup and dropoff locations assuming the request went through,
    // if it didn't go through, we should reset them
    if (
      "response" in message &&
      message.response === "ERROR" &&
      "category" in message &&
      message.category === "REQUEST_RIDE"
    ) {
      // something went wrong, reset the locations
      setPickUpLocation({ latitude: 0, longitude: 0 });
      setDropOffLocation({ latitude: 0, longitude: 0 });
    }
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

  // GET DISTANCE AND ETA FROM GMAPS when directions are shown
  const handleDirectionsReady = (result: {
    distance: number;
    duration: number;
  }) => {
    const distance = result.distance * 0.62137119; // Distance (km to mi)
    const duration = result.duration; // Travel time (minutes)

    console.log(`Distance: ${distance} mi, Travel time: ${duration} minutes`);
  };

  const polygonCoordinates = [
    { latitude: 47.666588, longitude: -122.311439 },
    { latitude: 47.667353, longitude: -122.316263 },
    { latitude: 47.652854, longitude: -122.316942 },
    { latitude: 47.648566, longitude: -122.304858 },
    { latitude: 47.660993, longitude: -122.301405 },
    { latitude: 47.661138, longitude: -122.311331 },
  ];

  // Map UI
  return (
    //putting the map region on the screen
    <View>
      <SafeAreaProvider style={{ flex: 1 }} />
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
        <Polygon
          coordinates={polygonCoordinates}
          strokeColor="rgba(128, 0, 128, 0.5)" // Light purple color
          fillColor="rgba(128, 0, 128, 0.2)" // Light purple transparent color
        />
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title={"userLocation"}
        >
          <Image
            source={require("../../assets/images/person-pindrop.webp")}
            style={{ height: 50, width: 35 }}
          />
        </Marker>
        <Marker
          coordinate={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          }}
          title={"driverLocation"}
        >
          <Image
            source={require("../../assets/images/car-pindrop.png")}
            style={{ height: 60, width: 45 }}
          />
        </Marker>
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
        {/* show the directions between the pickup and dropoff locations if they are valid */}
        {/* TODO: when these locations are (0,0) we get a gmaps error since it can't map between locations
          in the atlantic. It's not really a problem. 
          The other option would be the have these locations as a key to force rerender 
          and then check if the locations are not 0 here, but then the rerender loses our wonderful zoom. */}
        <MapViewDirections
          origin={pickUpLocation}
          destination={dropOffLocation}
          apikey={GOOGLE_MAPS_APIKEY}
          strokeWidth={3}
          strokeColor="#D1AE49"
          onReady={handleDirectionsReady}
        />
      </MapView>
      {/* profile button TEMPORARY? */}
      <View
        style={{
          position: "absolute",
          paddingVertical: 50,
          paddingHorizontal: 20,
          width: "100%",
          height: "100%",
        }}
      >
        <TouchableOpacity onPress={() => setProfileVisible(true)}>
          <Image
            source={require("@/assets/images/profile.png")}
            style={{ width: 35, height: 35, zIndex: 1 }}
          />
        </TouchableOpacity>
      </View>
      <View style={{ position: "absolute", width: "100%", height: "100%" }}>
        <RideRequestForm />
      </View>

      {/* profile pop-up modal */}
      <Profile
        isVisible={profileVisible}
        onClose={() => setProfileVisible(false)}
        netid={netid as string}
      />
    </View>
  );
}
