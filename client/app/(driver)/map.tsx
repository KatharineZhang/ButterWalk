/* eslint-disable @typescript-eslint/no-require-imports */
import {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import MapView, { PROVIDER_GOOGLE, Polygon, Marker } from "react-native-maps";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { styles } from "@/assets/styles";
import { Platform, View, Image } from "react-native";
import MapViewDirections from "react-native-maps-directions";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { PurpleZone } from "@/services/ZoneService";
import { HandleRidePhase } from "./home";

interface MapProps {
  startLocation: { latitude: number; longitude: number };
  pickUpLocation: { latitude: number; longitude: number };
  dropOffLocation: { latitude: number; longitude: number };
  studentLocation: { latitude: number; longitude: number };
  userLocationChanged: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  currState: HandleRidePhase; // the current state of the ride
}

// functions that can be called from the parent component
// using the ref
export interface MapRef {
  recenterMap: () => void; // recenter the map on the user's location
  pickupDistance: number; // distance for pickup leg
  dropoffDistance: number; // distance for dropoff leg
}

// Simple renders the points passing in through the props
// and keeps track of the user's location
const Map = forwardRef<MapRef, MapProps>(
  (
    {
      startLocation = { latitude: 0, longitude: 0 },
      pickUpLocation = { latitude: 0, longitude: 0 },
      dropOffLocation = { latitude: 0, longitude: 0 },
      studentLocation = { latitude: 0, longitude: 0 },
      userLocationChanged,
      currState = "headingToPickup",
    }: MapProps,
    ref
  ) => {
    // STATE VARIABLES
    // the student's location
    const [userLocation, setUserLocation] = useState<{
      latitude: number;
      longitude: number;
    }>({ latitude: 0, longitude: 0 });
    // waypoints (add stops along the route) for directions
    const [waypoints, setWaypoints] = useState<
      { latitude: number; longitude: number }[]
    >([pickUpLocation]);

    // what locations to focus on when zooming in on the map
    // in the format: [userLocation/startLocation, pickUpLocation, dropOffLocation]
    const [zoomOn, setZoomOn] = useState<
      { latitude: number; longitude: number }[]
    >([
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0 },
    ]);

    // GOOGLE MAPS API KEY
    const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
      ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY
      : "";

    // used for map zooming
    const mapRef = useRef<MapView>(null);

    // for calculating the distance of route, to be used in progress bar calculations
    const [pickupDistance, setPickupDistance] = useState<number>(0);
    const [dropoffDistance, setDropoffDistance] = useState<number>(0);

    const [seconds, setSeconds] = useState(10);

    /* USE EFFECTS */
    useEffect(() => {
      // start the timer to get ride
      const interval = setInterval(() => {
        if (seconds <= 0) {
          clearInterval(interval);
          return;
        }
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      // when the pickup location changes, update the waypoints
      setWaypoints([pickUpLocation]);
    }, [pickUpLocation]);

    useEffect(() => {
      // check if we have reached the waypoint
      // when the user reaches the waypoint, remove it from the directions
      // so we only route to the dropoff location at that point
      if (waypoints.length > 0) {
        if (isSameLocation(userLocation, pickUpLocation)) {
          console.log("Reached waypoint, clearing waypoints");
          setWaypoints([]);
        }
      }
    }, [userLocation]);

    // Track the current index for each route
    let pickupIndexRef = 0;
    let dropoffIndexRef = 0;
    let currStateInterval: number;

    // update the driver's location based on the current state
    useEffect(() => {
      if (currState == "none") {
        // when waiting for request, be at the default location
        console.log("Waiting, setting user location to default");
        setUserLocation({
          latitude: 47.66529658460914, // default to UW Seattle
          longitude: -122.31358955835384,
        });
        userLocationChanged({
          latitude: 47.66529658460914,
          longitude: -122.31358955835384,
        });
        pickupIndexRef = 0; // reset index
        dropoffIndexRef = 0; // reset index
      } else if (currState === "headingToPickup") {
        console.log("Heading to pickup, starting interval");
        currStateInterval = setInterval(() => {
          if (
            pickupIndexRef >= driverToPickupLocations.length &&
            currStateInterval !== null
          ) {
            console.log("clearing user location interval at end");
            clearInterval(currStateInterval);
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
      } else if (currState == "waitingForPickup") {
        // when waiting for request, be at the default location
        console.log("Waiting for pickup, setting user location to default");
        setUserLocation({
          latitude: 47.65718628834192,
          longitude: -122.3100908847018,
        });
        userLocationChanged({
          latitude: 47.65718628834192,
          longitude: -122.3100908847018,
        });
        studentLocation = {
          latitude: 47.65718628834192,
          longitude: -122.3100908847018,
        };
        clearInterval(currStateInterval);
        pickupIndexRef = 0; // reset index
        dropoffIndexRef = 0; // reset index
      } else if (currState === "headingToDropoff") {
        console.log("Heading to dropoff, starting interval");
        currStateInterval = setInterval(() => {
          if (
            dropoffIndexRef >= driverToDropOffLocations.length &&
            currStateInterval !== null
          ) {
            console.log("clearing user location interval at end");
            clearInterval(currStateInterval);
            dropoffIndexRef = 0;
            return;
          }

          console.log("Dropoff Interval running", dropoffIndexRef);

          setUserLocation({
            latitude: driverToDropOffLocations[dropoffIndexRef].latitude,
            longitude: driverToDropOffLocations[dropoffIndexRef].longitude,
          });
          userLocationChanged({
            latitude: driverToDropOffLocations[dropoffIndexRef].latitude,
            longitude: driverToDropOffLocations[dropoffIndexRef].longitude,
          });
          dropoffIndexRef++;
        }, 1000); // update every second
      } else {
        // arrived, stay at dropoff location
        console.log("Arrived at dropoff, setting user location to dropoff");
        setUserLocation({
          latitude: 47.651505074534704,
          longitude: -122.30686063977667,
        });
        userLocationChanged({
          latitude: 47.651505074534704,
          longitude: -122.30686063977667,
        });
        clearInterval(currStateInterval);
        pickupIndexRef = 0; // reset index
        dropoffIndexRef = 0; // reset index
      }
    }, [currState]);

    useEffect(() => {
      // when any of our locations change, check if we need to zoom on them
      // this is mainly because our user, pickup and dropoff locations set all the time (to the same values)
      // but we don't necessarily want to zoom in on those location unless they are actually different

      // If there is a start location, then there is a ride and we don't want to zoom on each user's location change
      // this allows the user to move the map around, and only re-center when they click the recenter button
      // if there is no start location, then we want to zoom on the user's location changes
      if (startLocation.latitude !== 0) {
        // check zoomOn index 0 aka startLocation
        if (!isSameLocation(startLocation, zoomOn[0])) {
          setZoomOn((prevZoomOn) => {
            const newZoomOn = [...prevZoomOn];
            newZoomOn[0] = startLocation;
            return newZoomOn;
          });
        }
      } else {
        // otherwise, use the user's location
        if (!isSameLocation(userLocation, zoomOn[0])) {
          setZoomOn((prevZoomOn) => {
            const newZoomOn = [...prevZoomOn];
            newZoomOn[0] = userLocation;
            return newZoomOn;
          });
        }
      }
      // check zoomOn index 1 aka pickUpLocation
      if (!isSameLocation(pickUpLocation, zoomOn[1])) {
        setZoomOn((prevZoomOn) => {
          const newZoomOn = [...prevZoomOn];
          newZoomOn[1] = pickUpLocation;
          return newZoomOn;
        });
      }
      // check zoomOn index 2 aka dropOffLocation
      if (!isSameLocation(dropOffLocation, zoomOn[2])) {
        setZoomOn((prevZoomOn) => {
          const newZoomOn = [...prevZoomOn];
          newZoomOn[2] = dropOffLocation;
          return newZoomOn;
        });
      }
    }, [userLocation, pickUpLocation, dropOffLocation]);

    useEffect(() => {
      // when we change what we want to zoom on, zoom on it
      recenterMap();
    }, [zoomOn]);

    useImperativeHandle(
      ref,
      // this is used to allow the parent component to call the recenterMap function
      () => ({
        recenterMap,
        pickupDistance,
        dropoffDistance,
      })
    );

    /* FUNCTIONS */
    // FOLLOW THE USER'S LOCATION
    // async function watchLocation() {
    //   const { status } = await Location.requestForegroundPermissionsAsync();
    //   if (status !== "granted") {
    //     console.log("Please grant location permission");
    //     Alert.alert(
    //       "Location Permission Required",
    //       "You have denied location access. Please enable it in settings.",
    //       [
    //         { text: "Cancel", style: "cancel" },
    //         { text: "Open Settings", onPress: () => Linking.openSettings() },
    //       ]
    //     );
    //     return;
    //   }

    //   await Location.watchPositionAsync(
    //     {
    //       accuracy: Location.Accuracy.High,
    //       timeInterval: 1000, // Update every second
    //       distanceInterval: 1, // Update every meter
    //     },
    //     (location) => {
    //       // when location changes, change our state
    //       setUserLocation({
    //         latitude: location.coords.latitude,
    //         longitude: location.coords.longitude,
    //       });
    //       // notify the parent component that the user's location has changed
    //       userLocationChanged({
    //         latitude: location.coords.latitude,
    //         longitude: location.coords.longitude,
    //       });
    //     }
    //   );
    // }

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
              latitude: pickUpLocation.latitude,
              longitude: pickUpLocation.longitude,
            }}
            title={"Pick Up Location"}
          >
            <View style={[styles.circleStart, { borderWidth: 0 }]}></View>
          </Marker>
          <Marker
            coordinate={{
              latitude: dropOffLocation.latitude,
              longitude: dropOffLocation.longitude,
            }}
            title={"Drop Off Location"}
          >
            <Image
              source={require("../../assets/images/dropoff-location.png")}
              style={{ height: 30, width: 30 }}
            />
          </Marker>
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title={"Your Location"}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 50,
                borderWidth: 2,
                // opacity: 0.8,
              }}
            >
              <Ionicons name="car-sharp" size={30} color="black" />
            </View>
          </Marker>
          <Marker
            coordinate={{
              latitude: studentLocation.latitude,
              longitude: studentLocation.longitude,
            }}
            title={"Student's Location"}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 50,
                borderWidth: 2,
                width: 35,
                height: 35,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome6 name="person-walking" size={24} color="black" />
            </View>
          </Marker>
          {/* show the directions between the pickup and dropoff locations if they are valid
        if the ride is not currently happening / happened  */}
          {userLocation.latitude !== 0 &&
            startLocation.latitude !== 0 &&
            pickUpLocation.latitude !== 0 &&
            dropOffLocation.latitude !== 0 && (
              <MapViewDirections
                origin={userLocation}
                waypoints={waypoints}
                destination={dropOffLocation}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={3}
                strokeColor="#000000"
                onReady={(result: {
                  legs?: { distance: { value: number } }[];
                  distance?: number;
                }) => {
                  if (result.legs && result.legs.length > 1) {
                    // we have a waypoint
                    // set the pickup distance
                    setPickupDistance(result.legs[0].distance.value);
                    // set the dropoff distance
                    if (
                      result.legs[1] !== undefined &&
                      result.legs[1].distance
                    ) {
                      setDropoffDistance(result.legs[1].distance.value);
                    }
                  } else if (result.legs && result.legs.length === 1) {
                    // no waypoint
                    setDropoffDistance(result.legs[0].distance.value);
                  } else if (typeof result.distance === "number") {
                    // if may be the case that we only have distance if there are no waypoints
                    setDropoffDistance(result.distance);
                  }
                }}
                onError={(errorMessage) => {
                  console.log("MapViewDirections error:", errorMessage);
                }}
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
  const SAME_LOCATION_THRESHOLD = 0.05; // 0.05 miles
  return calculateDistance(point1, point2) < SAME_LOCATION_THRESHOLD;
};

export default Map;

// farmers market to parrington
const driverToPickupLocations = [
  { latitude: 47.66529658460914, longitude: -122.31358955835384 },
  { latitude: 47.665065369830515, longitude: -122.31444786518557 },
  { latitude: 47.66494976205713, longitude: -122.31386850807415 },
  { latitude: 47.66495022618298, longitude: -122.31311791792947 },
  { latitude: 47.664863520185676, longitude: -122.31251710314729 },
  { latitude: 47.66487797119523, longitude: -122.31131547358287 },
  { latitude: 47.66487797119523, longitude: -122.31022113237242 },
  { latitude: 47.664863520185676, longitude: -122.30967396176719 },
  { latitude: 47.66412735651641, longitude: -122.3096404891312 },
  { latitude: 47.66321206084433, longitude: -122.3096404891312 },
  { latitude: 47.66176733084499, longitude: -122.3097697671799 },
  { latitude: 47.66095509927256, longitude: -122.3097844740822 },
  { latitude: 47.66011313857209, longitude: -122.30972564647298 },
  { latitude: 47.65925736458627, longitude: -122.30968477128673 },
  { latitude: 47.658514912737736, longitude: -122.30954940014837 },
  { latitude: 47.657368650554865, longitude: -122.30978146495697 },
  { latitude: 47.65718628834192, longitude: -122.3100908847018 },
];

// parrington to winklewerder
const driverToDropOffLocations = [
  { latitude: 47.65718628834192, longitude: -122.3100908847018 },
  { latitude: 47.65741960363522, longitude: -122.30966869133536 },
  { latitude: 47.6584024032965, longitude: -122.30969014900613 },
  { latitude: 47.658951606814455, longitude: -122.30964723366453 },
  { latitude: 47.65981875850166, longitude: -122.3095184876398 },
  { latitude: 47.65981875850166, longitude: -122.30850997711252 },
  { latitude: 47.65971759154697, longitude: -122.30743709357286 },
  { latitude: 47.659052775253414, longitude: -122.30647149838717 },
  { latitude: 47.658200063702026, longitude: -122.30544153018909 },
  { latitude: 47.65786764695169, longitude: -122.30462613869895 },
  { latitude: 47.65710163507817, longitude: -122.30484071540687 },
  { latitude: 47.65603209026653, longitude: -122.30449739267421 },
  { latitude: 47.655237144119184, longitude: -122.30464759636976 },
  { latitude: 47.65441327806877, longitude: -122.30492654609004 },
  { latitude: 47.65395075108017, longitude: -122.30522695348117 },
  { latitude: 47.65322804445887, longitude: -122.30524841115195 },
  { latitude: 47.65279441568511, longitude: -122.30574193758021 },
  { latitude: 47.65233905698946, longitude: -122.30640709060751 },
  { latitude: 47.65221619377763, longitude: -122.30667531149331 },
  { latitude: 47.652078875728186, longitude: -122.30768382202385 },
  { latitude: 47.651486248342344, longitude: -122.30747857961833 },
  { latitude: 47.651505074534704, longitude: -122.30686063977667 },
];
