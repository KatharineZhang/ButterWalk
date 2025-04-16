/* eslint-disable @typescript-eslint/no-require-imports */
import { useState, useEffect, useRef } from "react";
import MapView, { Polygon, Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { styles } from "@/assets/styles";
import { View, Image, Alert, Linking } from "react-native";
import MapViewDirections from "react-native-maps-directions";
import { Ionicons } from "@expo/vector-icons";

interface MapProps {
  pickUpLocation: { latitude: number; longitude: number };
  dropOffLocation: { latitude: number; longitude: number };
  driverLocation: { latitude: number; longitude: number };
  userLocationChanged: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  status:
    | "WaitingForRide" // the ride has been requested
    | "DriverEnRoute" // the ride is accepted
    | "DriverArrived" // the driver is at the pickup location
    | "RideInProgress" // the driver is taking the student to dropoff location
    | "RideCompleted"; // the driver arrived at the dropoff location
}

// Simple renders the points passing in through the props
// and keeps track of the user's location
export default function Map({
  driverLocation = { latitude: 0, longitude: 0 },
  pickUpLocation = { latitude: 0, longitude: 0 },
  dropOffLocation = { latitude: 0, longitude: 0 },
  status,
  userLocationChanged,
}: MapProps) {
  // STATE VARIABLES
  // the student's location
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  

  // what locations to focus on when zooming in on the map
  // in the format: [userLocation, driverLocation, pickUpLocation, dropOffLocation]
  const [zoomOn, setZoomOn] = useState<
    { latitude: number; longitude: number }[]
  >([
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 0 },
  ]);

  const [ridePath, setRidePath] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  useEffect(() => {
    if (status === "RideInProgress" && driverLocation.latitude != 0) {
      // if the ride is in progress, show the path
      // add newest driverLocation to the path
      setRidePath([...ridePath, driverLocation]);
      console.log("RIDE PATH:", ridePath);
    }
  }, [driverLocation]);

  useEffect(() => {
    // when the ride is completed, clear the path
    if (status === "RideCompleted") {
      setRidePath([]);
    }
  }, [status]);

  // GOOGLE MAPS API KEY
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
    if (calculateDistance(userLocation, zoomOn[0]) > 0.001) {
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[0] = userLocation;
        return newZoomOn;
      });
    }
    // check zoomOn index 1 aka driverLocation
    if (calculateDistance(driverLocation, zoomOn[1]) > 0.001) {
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[1] = driverLocation;
        return newZoomOn;
      });
    }
    // check zoomOn index 2 aka pickUpLocation
    if (calculateDistance(pickUpLocation, zoomOn[2]) > 0.001) {
      setZoomOn((prevZoomOn) => {
        const newZoomOn = [...prevZoomOn];
        newZoomOn[2] = pickUpLocation;
        return newZoomOn;
      });
    }
    // check zoomOn index 3 aka dropOffLocation
    if (calculateDistance(dropOffLocation, zoomOn[3]) > 0.001) {
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
        userInterfaceStyle="light"
      >
        <Polygon
          coordinates={polygonCoordinates}
          strokeColor="rgba(128, 0, 128, 0.5)" // Light purple color
          fillColor="rgba(128, 0, 128, 0.2)" // Light purple transparent color
        />
        {calculateDistance(userLocation, pickUpLocation) > 0.0001 && (
          <Marker
            coordinate={{
              latitude: pickUpLocation.latitude,
              longitude: pickUpLocation.longitude,
            }}
            title={"pickUpLocation"}
          >
            <View style={[styles.circleStart, { borderWidth: 0 }]}></View>
          </Marker>
        )}
        <Marker
          coordinate={{
            latitude: dropOffLocation.latitude,
            longitude: dropOffLocation.longitude,
          }}
          title={"dropOffLocation"}
        >
          <Image
            source={require("../../assets/images/dropoff-location.png")}
            style={{ height: 30, width: 30 }}
          />
        </Marker>
        {status != "RideInProgress" && <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title={"userLocation"}
        >
          <View
            style={{
              backgroundColor: "#C5B4E3",
              borderRadius: 50,
              opacity: 0.8,
            }}
          >
            <Ionicons name="locate-sharp" size={25} color="black" />
          </View>
        </Marker>}
        <Marker
          coordinate={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          }}
          title={"driverLocation"}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 50,
              borderWidth: 2,
              // opacity: 0.8,
            }}
          >
            {/* <Ionicons name="locate-sharp" size={25} color="black" /> */}
            <Ionicons name="car-sharp" size={30} color="black" />
          </View>
        </Marker>
        {/* TODO: Move the MapViewDirections rendering to the server, i.e. 
         SERVER SIDE RENDERING or SSR. It is also possible that we can make
         the API call on the server and render on the client. Either way, the
         API key needs to be sent from the server environment, not the client
         (so the user does not have access to the API key).
         TODO 2: Look for other places in the code base where credenials are
         being compiled into the client and move them to SSR as well.
         (this may be a major undertaking depending on how much this is done)*/}
        {/* show the directions between the pickup and dropoff locations if they are valid
        if the ride is not currently happening / happened  */}
        {status != "RideInProgress" &&
          status != "RideCompleted" &&
          pickUpLocation.latitude != 0 &&
          dropOffLocation.latitude != 0 && (
            <MapViewDirections
              origin={pickUpLocation}
              destination={dropOffLocation}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={3}
              strokeColor="#4B2E83"
            />
            
          )}
          {/* TODO: show the directions between the users current location and the
          pick up location if they are far enough apart*/}
          {status != "RideInProgress" &&
          status != "RideCompleted" &&
          userLocation.latitude != 0 &&
          pickUpLocation.latitude != 0 && (
            <MapViewDirections
              origin={userLocation}
              destination={pickUpLocation}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={3}
              strokeColor="#000000"
            />
            
          )}
          

        {/* show the path of the ride if it is in progress */}
        {status === "RideInProgress" && (
          <Polyline
            coordinates={ridePath}
            strokeWidth={3}
            strokeColor="#4B2E83"
          />
        )}
      </MapView>
    </View>
  );
}

// HELPER FOR USE EFFECT: calculate the distance between two points to check if we should update the zoomOn state
export const calculateDistance = (
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
) => {
  return Math.sqrt(
    Math.pow(point1.latitude - point2.latitude, 2) +
      Math.pow(point1.longitude - point2.longitude, 2)
  );
};
