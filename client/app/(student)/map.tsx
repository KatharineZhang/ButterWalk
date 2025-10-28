/* eslint-disable @typescript-eslint/no-require-imports */
import {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import MapView, {
  PROVIDER_GOOGLE,
  Polygon,
  Marker,
} from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { styles } from "@/assets/styles";
import { View, Image, Alert, Linking, Platform } from "react-native";
import MapViewDirections from "react-native-maps-directions";
import { Ionicons } from "@expo/vector-icons";
import { PurpleZone } from "@/services/ZoneService";

interface MapProps {
  pickUpLocation: { latitude: number; longitude: number };
  dropOffLocation: { latitude: number; longitude: number };
  driverLocation: { latitude: number; longitude: number };
  startLocation: { latitude: number; longitude: number };
  userLocationChanged: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  status:
    | "WaitingForRide" // the ride has been requested
    | "DriverEnRoute" // the ride is accepted
    | "DriverArrived" // the driver is at the pickup location
    | "RideInProgress" // the driver is taking the student to dropoff location
    | "RideCompleted" // the driver arrived at the dropoff location
    | "none";
  whichComponent:
    | "rideReq"
    | "confirmRide"
    | "Loading"
    | "waitForRide"
    | "handleRide";
}

// const production = false; //TODO: remove?

// functions that can be called from the parent component
// using the ref
export interface MapRef {
  recenterMap: () => void; // recenter the map on the user's location
}

// Simple renders the points passing in through the props
// and keeps track of the user's location
const Map = forwardRef<MapRef, MapProps>(
  (
    {
      driverLocation = { latitude: 0, longitude: 0 },
      pickUpLocation = { latitude: 0, longitude: 0 },
      dropOffLocation = { latitude: 0, longitude: 0 },
      startLocation = { latitude: 0, longitude: 0 },
      status,
      userLocationChanged,
    },
    ref
  ) => {
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

    // GOOGLE MAPS API KEY
    const GOOGLE_MAPS_APIKEY =
      // production
      //   ? Platform.OS == "ios"
      //     ? process.env.EXPO_PUBLIC_IOS_GMAPS_APIKEY
      //       ? process.env.EXPO_PUBLIC_IOS_GMAPS_APIKEY
      //       : ""
      //     : Platform.OS == "android"
      //       ? process.env.EXPO_PUBLIC_ANDROID_GMAPS_APIKEY
      //         ? process.env.EXPO_PUBLIC_ANDROID_GMAPS_APIKEY
      //         : ""
      //       : // default case
      //         ""
      //   : // local
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
        ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
        : "";

    // used for map zooming
    const mapRef = useRef<MapView>(null);

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
      if (!isSameLocation(userLocation, zoomOn[0])) {
        setZoomOn((prevZoomOn) => {
          const newZoomOn = [...prevZoomOn];
          newZoomOn[0] = userLocation;
          return newZoomOn;
        });
      }
      // check zoomOn index 1 aka driverLocation
      if (!isSameLocation(driverLocation, zoomOn[1])) {
        setZoomOn((prevZoomOn) => {
          const newZoomOn = [...prevZoomOn];
          newZoomOn[1] = driverLocation;
          return newZoomOn;
        });
      }
      // check zoomOn index 2 aka pickUpLocation
      if (!isSameLocation(pickUpLocation, zoomOn[2])) {
        setZoomOn((prevZoomOn) => {
          const newZoomOn = [...prevZoomOn];
          newZoomOn[2] = pickUpLocation;
          return newZoomOn;
        });
      }
      // check zoomOn index 3 aka dropOffLocation
      if (!isSameLocation(dropOffLocation, zoomOn[3])) {
        setZoomOn((prevZoomOn) => {
          const newZoomOn = [...prevZoomOn];
          newZoomOn[3] = dropOffLocation;
          return newZoomOn;
        });
      }
    }, [userLocation, driverLocation, pickUpLocation, dropOffLocation]);

    useEffect(() => {
      // when we change what we want to zoom on, zoom on it
      recenterMap();
    }, [zoomOn]);

    useImperativeHandle(
      ref,
      // this is used to allow the parent component to call the recenterMap function
      () => ({
        recenterMap,
      })
    );

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (location) => {
          // // when location changes, change our state
          // setUserLocation({
          //   latitude: 47.65605827543173,
          //   longitude: -122.3139639865059,
          // });
          // // notify the parent component that the user's location has changed
          // userLocationChanged({
          //   latitude: 47.65605827543173,
          //   longitude: -122.3139639865059,
          // });
        }
      );
    }

        // Track the current index for each route
    let pickupIndexRef = 0;
    let currPhaseInterval: number;

    useEffect(() => {
      if (status == "none"){
   // when location changes, change our state
          setUserLocation({
            latitude: 47.65605827543173,
            longitude: -122.3139639865059,
          });
          // notify the parent component that the user's location has changed
          userLocationChanged({
            latitude: 47.65605827543173,
            longitude: -122.3139639865059,
          });
      } else if (status == "WaitingForRide") {
        console.log("Heading to pickup, starting interval");
        currPhaseInterval = setInterval(() => {
          if (
            pickupIndexRef >= driverToPickupLocations.length &&
            currPhaseInterval !== null
          ) {
            console.log("clearing user location interval at end");
            clearInterval(currPhaseInterval);
            pickupIndexRef = 0;
            return;
          }

          console.log("Pickup Interval running", pickupIndexRef);

          setUserLocation({
            latitude: driverToPickupLocations[pickupIndexRef].latitude,
            longitude: driverToPickupLocations[pickupIndexRef].longitude,
          });
          userLocationChanged({
            latitude: driverToPickupLocations[pickupIndexRef].latitude,
            longitude: driverToPickupLocations[pickupIndexRef].longitude,
          });
          pickupIndexRef++;
        }, 1000); // update every second
      }
    }, [status])

    // RECENTER
    const recenterMap = () => {
      centerMapOnLocations(zoomOn);
    };

    // CENTER MAP ON LOCATIONS
    const centerMapOnLocations = (
      locations: { latitude: number; longitude: number }[]
    ) => {
      // filter out any locations that are 0,0
      locations = locations.filter(
        (loc) => loc.latitude != 0 && loc.longitude != 0
      );
      mapRef?.current?.fitToCoordinates(locations, {
        edgePadding: { bottom: 300, left: 80, right: 70, top: 50 },
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
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
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
          {/* show each segment of the purple zone on the map */}
          {PurpleZone.zones.map((zone, index) => (
            <Polygon
              key={index}
              coordinates={zone.coordinates}
              strokeColor="rgba(128, 0, 128, 0.5)" // Light purple color
              fillColor="rgba(128, 0, 128, 0.2)" // Light purple transparent color
            />
          ))}
          <Marker
            coordinate={{
              latitude: pickUpLocation.latitude,
              longitude: pickUpLocation.longitude,
            }}
            title={"Pickup Location"}
          >
            <View style={[styles.circleStart, { borderWidth: 0 }]}></View>
          </Marker>
          <Marker
            coordinate={{
              latitude: startLocation.latitude + 0.0001, // offset to avoid overlap with user marker
              longitude: startLocation.longitude + 0.0001,
            }}
            title={"Start Location"}
          >
            <View
              style={[styles.circleStart, { backgroundColor: "white" }]}
            ></View>
          </Marker>

          <Marker
            coordinate={{
              latitude: dropOffLocation.latitude,
              longitude: dropOffLocation.longitude,
            }}
            title={"Dropoff Location"}
          >
            <Image
              source={require("../../assets/images/dropoff-location.png")}
              style={{ height: 30, width: 30 }}
            />
          </Marker>
          {status != "RideInProgress" && (
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title={"Your Location"}
            >
              <View
                style={{
                  backgroundColor: "rgba(197, 180, 227, 0.8)", // reduced opacity
                  borderRadius: 50,
                  height: 45,
                  width: 45,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    borderRadius: 13,
                    backgroundColor: "#4B2E83",
                    height: 15,
                    width: 15,
                  }}
                />
              </View>
            </Marker>
          )}
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
              }}
            >
              <Ionicons name="car-sharp" size={30} color="black" />
            </View>
          </Marker>
          {/* show the directions between the pickup and dropoff locations if they are valid,
          a ride has been requested, and if the ride is not currently happening / happened */}
          {status !== "RideInProgress" &&
            status !== "RideCompleted" &&
            startLocation.latitude !== 0 &&
            pickUpLocation.latitude !== 0 && (
              <MapViewDirections
                origin={userLocation}
                destination={pickUpLocation}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={3}
                strokeColor="#000000"
              />
            )}

          {/* shows directions from pickup -> dropoff, if valid 
          (using the driverLocation as the origin) if ride is progress */}
          {status === "RideInProgress" &&
            driverLocation.latitude !== 0 &&
            pickUpLocation.latitude !== 0 &&
            dropOffLocation.latitude !== 0 && (
              <MapViewDirections
                origin={driverLocation}
                destination={dropOffLocation}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={3}
                strokeColor="#000000"
              />
            )}
        </MapView>
      </View>
    );
  }
);

// HELPER FOR USE EFFECT: calculate the distance between two points to check if we should update the zoomOn state
export const calculateDistance = (
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
) => {
  if (!point1 || !point2) {
    return 0; // if either point is null, return 0
  }
  // use the haversine formula to calculate the distance between two points
  // based on https://www.geeksforgeeks.org/haversine-formula-to-find-distance-between-two-points-on-a-sphere/
  const R = 6371; // radius of earth in km
  const dLat = (point2.latitude - point1.latitude) * (Math.PI / 180); // distance btw lat converted to radians
  const dLon = (point2.longitude - point1.longitude) * (Math.PI / 180); // distance btw lng converted to radians
  const h =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.cos(point1.latitude * (Math.PI / 180)) *
      Math.cos(point2.latitude * (Math.PI / 180)) *
      Math.pow(Math.sin(dLon / 2), 2);
  const d = 2 * R * Math.asin(Math.sqrt(h)); // distance in km
  return d * 0.6213711922; // return distance in miles
};

export const isSameLocation = (
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
) => {
  // check if the distance between two points is less than the threshold
  const SAME_LOCATION_THRESHOLD = 0.02; // 0.02 miles
  return calculateDistance(point1, point2) < SAME_LOCATION_THRESHOLD;
};

export default Map;

const driverToPickupLocations = [
  {
            latitude: 47.65605827543173,
            longitude: -122.3139639865059,
          },
{ latitude: 47.66011313857209, longitude: -122.30972564647298 },
  { latitude: 47.65925736458627, longitude: -122.30968477128673 },
  { latitude: 47.658514912737736, longitude: -122.30954940014837 },
  { latitude: 47.657368650554865, longitude: -122.30978146495697 },
  { latitude: 47.65718628834192, longitude: -122.3100908847018 },
];
