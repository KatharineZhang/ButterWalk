/* eslint-disable @typescript-eslint/no-require-imports */
import { useState, useEffect, useRef } from "react";
import MapView, { Polygon, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { styles } from "@/assets/styles";
import { View, Image, Alert, Linking } from "react-native";
import MapViewDirections from "react-native-maps-directions";

interface MapProps {
  pickUpLocation: { latitude: number; longitude: number };
  dropOffLocation: { latitude: number; longitude: number };
  driverLocation: { latitude: number; longitude: number };
  rideDuration: number;

  userLocationChanged: (location: {
    latitude: number;
    longitude: number;
  }) => void;
}

// Simple renders the points passing in through the props
// and keeps track of the user's location
export default function Map({
  driverLocation = { latitude: 0, longitude: 0 },
  pickUpLocation = { latitude: 0, longitude: 0 },
  dropOffLocation = { latitude: 0, longitude: 0 },
  // rideDuration, // show the ride duration on the route
  userLocationChanged,
}: MapProps) {
  // STATE VARIABLES
  // the student's location
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  // in the format: [userLocation, driverLocation, pickUpLocation, dropOffLocation]
  const [zoomOn, setZoomOn] = useState<
    { latitude: number; longitude: number }[]
  >([
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0 },
  ]);

  const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
    ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
    : "";

  // used for map zooming
  const mapRef = useRef<MapView>(null);

  // UW parameter
  const polygonCoordinates = [
    { latitude: 47.666588, longitude: -122.311439 },
    { latitude: 47.667353, longitude: -122.316263 },
    { latitude: 47.652854, longitude: -122.316942 },
    { latitude: 47.648566, longitude: -122.304858 },
    { latitude: 47.660993, longitude: -122.301405 },
    { latitude: 47.661138, longitude: -122.311331 },
  ];

  // STATE HOOKS
  useEffect(() => {
    // on the first render, get the user's location
    // and set up listeners
    watchLocation();
  }, []);

  useEffect(() => {
    // when any of our locations change, check if we need to zoom on them
    // this is mainly because our user, pickup and dropoff locations set all the time (to the same values)
    // but we don't necessarily want to zoom in on those location unless they are actually different
    if (calculateDistance(userLocation, zoomOn[0]) > 10) {
      console.log("updating user location", userLocation);
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[0] = userLocation;
        return newZoomOn;
      });
    }
    // check zoomOn index 1 aka driverLocation
    if (calculateDistance(driverLocation, zoomOn[1]) > 10) {
      console.log("updating driver location", driverLocation);
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[1] = driverLocation;
        return newZoomOn;
      });
    }
    // check zoomOn index 2 aka pickUpLocation
    if (calculateDistance(pickUpLocation, zoomOn[2]) > 10) {
      console.log("updating pickup location", pickUpLocation);
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[2] = pickUpLocation;
        return newZoomOn;
      });
    }
    // check zoomOn index 3 aka dropOffLocation
    if (calculateDistance(dropOffLocation, zoomOn[3]) > 10) {
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
        // notify the parent component that the user's location has changed
        userLocationChanged({
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
    </View>
  );
}
