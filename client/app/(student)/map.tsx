// import React, { useState } from "react";
import React, { useState, useEffect } from "react";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { styles } from "@/assets/styles";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import { Alert, Linking } from "react-native";

export default function App() {
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();
  // Use netid to pair this WebSocket connection with a netid
  WebSocketService.connect(netid as string, "DRIVER");

  // the drivers's location
  const [userLocation, setuserLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

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
    //this worked when i had this function in the useEffect(), but that only got the
    //location when the page re-rendered, so i need a different plan
    console.log("Location: ");
    console.log(currentLocation);
    return {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };
  };

  useEffect(() => {
    // get and set our state to the location
    const fetchuserLocation = async () => {
      const location = await getPermissions();
      if (location) {
        setuserLocation({
          latitude:
            location.latitude != 0 ? location.latitude : 47.65462693267042,
          longitude:
            location.longitude != 0 ? location.longitude : -122.30938853301136,
        });
      }
    };
    fetchuserLocation();
  }, []);

  // const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
  //   ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
  //   : "";

  return (
    //putting the map region on the screen
    <View>
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
        {/* show the user's location */}
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title={"userLocation"}
        />
      </MapView>
    </View>
  );
}
