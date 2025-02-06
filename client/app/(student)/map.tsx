import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import { WebSocketResponse } from "../../../server/src/api";
import { Geolocation } from "@capacitor/Geolocation";
import { GoogleMap } from "@capacitor/google-maps";
import { styles } from "@/assets/styles";

export default async function StudentMap() {
  const { netid } = useLocalSearchParams();
  //const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  WebSocketService.connect(netid as string, "STUDENT");

  const mapRef = useRef<HTMLDivElement | null>(null);
  //setUserLocation: updates the user's location in React state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  //const [setLocation] = useState<{ lat: number; lng: number } | null>(null);

  //ask permision to get location from user
  const requestPermissions = async () => {
    const status = await Geolocation.requestPermissions();
    console.log("Permission Status:", status);
  };

  const getCurrentLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition();
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setUserLocation(newLocation);
      console.log("User Location:", newLocation);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  requestPermissions().then(getCurrentLocation);

  const watchId = await Geolocation.watchPosition({}, (position, err) => {
    if (position) {
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      //sendLocationToWebSocket(latitude, longitude);
    }
  });

  useEffect(() => {
    requestPermissions();
    getCurrentLocation();
    return () => {
      Geolocation.clearWatch({ id: watchId });
    };
  }, [netid]);

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
      <SafeAreaProvider>
        <Header netid={netid as string} />
        <View style={styles.container}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 47.6097,
              longitude: -122.3331,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
          >
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.lat,
                  longitude: userLocation?.lng,
                }}
                title="You are here"
                description="Your current location"
              />
            )}
          </MapView>
        </View>
      </SafeAreaProvider>
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
    </View>
  );
}
