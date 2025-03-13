/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useState, useEffect, useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import MapViewDirections from "react-native-maps-directions";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { styles } from "@/assets/styles";
import { View, Text, Pressable, TouchableOpacity, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import WebSocketService, {
  WebsocketConnectMessage,
} from "@/services/WebSocketService";
import { Alert, Linking } from "react-native";
import {
  DriverAcceptResponse,
  WebSocketResponse,
} from "../../../server/src/api";
import { LocationNames, LocationService } from "@/services/LocationService";
import RideRequestForm from "@/components/RideRequestForm";

export default function App() {
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();

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

  const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
    ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
    : "";

  // only zoom when we want to zoom (by changing this variable)
  // in the format: [userLocation, pickUpLocation, dropOffLocation]
  const [zoomOn, setZoomOn] = useState<
    { latitude: number; longitude: number }[]
  >([
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0 },
  ]);

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
    // TODO: MOVE CONNECTION TO THE SIGNIN.TSX WHEN THAT IS IMPLEMENTED
    // await connection from websocket
    const connectWebSocket = async () => {
      const msg: WebsocketConnectMessage = await WebSocketService.connect();
      if (msg == "Connected Successfully") {
        console.log("connected");
      } else {
        console.log("failed to connect!!!");
      }
    };
    connectWebSocket();
    // on the first render, get the user's location
    // and set up listeners
    watchLocation();
    WebSocketService.addListener(handleLocation, "LOCATION");
    WebSocketService.addListener(handleAccept, "ACCEPT_RIDE");
    WebSocketService.addListener(handleCompleteOrCancel, "CANCEL");
    WebSocketService.addListener(handleCompleteOrCancel, "COMPLETE");
  }, []);

  useEffect(() => {
    // we only want to update the zoom if a drastic change was made,
    // i.e. the pickup and dropoff locations were finally set to valid values,
    // or they where set back to invalid values (0,0)
    // only update zoomOn in these cases to allow the user more flexibility to
    // move the map without being forced into a zoomed view
    const diff0 = calculateDistance(userLocation, zoomOn[0]);
    const diff1 = calculateDistance(pickUpLocation, zoomOn[1]);
    const diff2 = calculateDistance(dropOffLocation, zoomOn[2]);

    // check index 0, aka user location
    // this will typically be true after fetchLocation is called and the user's location is first set
    if (diff0 > 10) {
      console.log("updating user location", userLocation);
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[0] = userLocation;
        return newZoomOn;
      });
    }

    // check index 1, aka pickup location
    if (diff1 > 10) {
      console.log("updating pickup location", pickUpLocation);
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[1] = pickUpLocation;
        return newZoomOn;
      });
    }

    // check index 2, aka dropoff location
    if (diff2 > 10) {
      console.log("updating dropoff location", dropOffLocation);
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[2] = dropOffLocation;
        return newZoomOn;
      });
    }

    // since we know locations have updated, send the new location to the student
    if (rideInfo.netid != "") {
      WebSocketService.send({
        directive: "LOCATION",
        id: netid as string,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    }
  }, [userLocation, pickUpLocation, dropOffLocation]);

  useEffect(() => {
    // when we change what we want to zoom on, change the zoom
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

  // ZOOM INTO GIVEN LOCATIONS
  const centerMapOnLocations = (
    locations: { latitude: number; longitude: number }[]
  ) => {
    // filter out any locations that are 0,0 from zoomOn
    locations = locations.filter(
      (loc) => loc.latitude != 0 && loc.longitude != 0
    );
    console.log("ZOOMING TO LOCATIONS:", locations);
    mapRef?.current?.fitToCoordinates(locations, {
      edgePadding: { top: 100, right: 100, bottom: 50, left: 100 },
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
      setPickUpLocation(
        // get coordinates from location names
        LocationService.getLatAndLong(driverAccept.location as LocationNames)
      );
      setDropOffLocation(
        // get coordinates from location names
        LocationService.getLatAndLong(driverAccept.destination as LocationNames)
      );
    }
  };

  // Cancel / Complete Ride Message Handling
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

      setPickUpLocation({ latitude: 0, longitude: 0 });
      setDropOffLocation({ latitude: 0, longitude: 0 });
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

  // Map UI
  return (
    <View style={styles.mapContainer}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <Header netid={netid as string} />
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude || 47.65462693267042,
            longitude: userLocation.longitude || -122.30938853301136,
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
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={sendAccept}
              style={{
                backgroundColor: "#4B2E83",
                padding: 10,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: "white" }}>Accept</Text>
            </Pressable>
            <Pressable
              onPress={sendCancel}
              style={{
                backgroundColor: "#4B2E83",
                padding: 10,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: "white" }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={sendComplete}
              style={{
                backgroundColor: "#4B2E83",
                padding: 10,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: "white" }}>Complete</Text>
            </Pressable>
            {/* recenter button */}
            <TouchableOpacity onPress={() => centerMapOnLocations(zoomOn)}>
              <Image
                source={require("@/assets/images/recenter.png")}
                style={{ width: 50, height: 50 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaProvider>

      {/* Overlay the RideRequestForm on top of the map */}
      <View style={styles.formOverlay}>
        <RideRequestForm />
      </View>
    </View>
  );
}
