import { useState, useEffect, useRef } from "react";
import {
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Profile from "./profile";
import Map, { calculateDistance, isSameLocation, MapRef } from "./map";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import {
  DistanceResponse,
  ErrorResponse,
  LocationResponse,
  LocationType,
  RequestRideResponse,
  User,
  WaitTimeResponse,
  WebSocketResponse,
} from "../../../server/src/api";
import RideRequestForm from "@/components/RideRequestForm";
import ConfirmRide from "@/components/ConfirmRide";
import FAQ from "./faq";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/assets/styles";
import HandleRideComponent from "@/components/HandleRideComp";
import { createOpenLink } from "react-native-open-maps";
import LoadingPageComp from "@/components/loadingPageComp";
import Notification from "@/components/notification";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Legend from "@/components/Legend";

export default function HomePage() {
  /* GENERAL HOME PAGE STATE AND METHODS */
  const { netid } = useLocalSearchParams<{ netid: string }>();
  // FAQ State
  const [FAQVisible, setFAQVisible] = useState(false);
  // which bottom component to show
  const [whichComponent, setWhichComponent] = useState<
    "rideReq" | "confirmRide" | "Loading" | "waitForRide" | "handleRide"
  >("rideReq");

  // what notification to show
  const [notifState, setNotifState] = useState<{
    text: string;
    color: string;
    boldText?: string;
  }>({
    text: "",
    color: "",
    boldText: "",
  });

  /* MAP STATE AND METHODS */
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

  // when the user's location changes,
  // the map will call this function to alert the home page of the change
  // updates home page's record of the user's location
  const userLocationChanged = (location: {
    latitude: number;
    longitude: number;
  }) => {
    setUserLocation(location);
    // if the ride has been accepted, send the new location to the driver
    if (rideStatus === "DriverEnRoute") {
      WebSocketService.send({
        directive: "LOCATION",
        id: netid,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  };

  // retain a reference to the map to call functions on it later
  const mapRef = useRef<MapRef>(null);
  // when the user clicks the recenter button
  // recenter the map to the user's location
  const recenter = () => {
    if (mapRef.current) {
      mapRef.current.recenterMap();
    }
  };

  //* RIDE REQUEST STATE AND METHODS */
  // the pickup coordinates
  const [pickUpLocation, setPickUpLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });
  // the dropoff coordinates
  const [dropOffLocation, setDropOffLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  // many components use the location name, so we store it here
  const [pickUpLocationName, setPickUpLocationName] = useState<string>("");
  const [dropOffLocationName, setDropOffLocationName] = useState<string>("");
  const [numPassengers, setNumPassengers] = useState(1);

  // user clicked on request ride button on ride request form
  // we want to show the confirm ride component
  const rideRequested = (numPassengers: number) => {
    setNumPassengers(numPassengers);
    setWhichComponent("confirmRide");
  };

  // the user's recent locations that will be displayed in the dropdown
  const [recentLocations, setRecentLocations] = useState<LocationType[]>([]);

  /* PROFILE STATE AND METHODS */
  const [profileVisible, setProfileVisible] = useState(false);
  const [user, setUser] = useState<User>({} as User);

  /* CONFIRM RIDE STATE AND METHODS */
  // the amount of time the ride will take
  const [rideDuration, setRideDuration] = useState(0);
  // the amount of time the driver will take to reach the student
  const [driverETA, setDriverETA] = useState(0);
  // allows the user to go back to the ride request form
  // while keeping the previous state
  const [startingState, setStartingState] = useState<
    { pickup: string; dropoff: string; numRiders: number } | undefined
  >(undefined);
  // keep track of the request id once the ride is in the database
  const [requestid, setRequestID] = useState("");

  // the user clicked the back button on the confirm ride component
  // we want to go back to the ride request form with the previous state
  const closeConfirmRide = () => {
    setWhichComponent("rideReq");
    setStartingState({
      pickup: pickUpLocationName,
      dropoff: dropOffLocationName,
      numRiders: numPassengers,
    });
  };

  // the user confirmed that they want to request the ride
  // now is when we send the ride request to the server
  const requestRide = async () => {
    // send the ride request to the server
    WebSocketService.send({
      directive: "REQUEST_RIDE",
      phoneNum: user.phoneNumber as string,
      netid,
      location: {
        name: pickUpLocationName,
        address: pickUpAddress,
        coordinates: pickUpLocation,
      },
      destination: {
        name: dropOffLocationName,
        address: dropOffAddress,
        coordinates: dropOffLocation,
      },
      numRiders: numPassengers,
    });
    // set the component to show to loading
    setWhichComponent("Loading");
  };

  /* HANDLE RIDE STATE */
  const [pickUpAddress, setPickUpAddress] = useState("");
  const [dropOffAddress, setDropOffAddress] = useState("");
  // the address of the user's starting location
  const [walkAddress, setWalkAddress] = useState("");
  // the amount of minutes it will take to walk to the pickup location
  const [walkDuration, setWalkDuration] = useState(0);

  // the reason could be that the user clicked the cancel button
  // or the timer ran out
  const cancelReason = useRef<"button" | "timer">("button");

  // the user wishes to cancel the ride
  // we want to send a cancel request to the server
  const cancelRide = (reason: "button" | "timer") => {
    cancelReason.current = reason;
    // call cancel route
    WebSocketService.send({ directive: "CANCEL", netid, role: "STUDENT" });
  };

  // show different state in the DriverOneWay component
  // based on the status of the ride
  const [rideStatus, setRideStatus] = useState<
    | "WaitingForRide"
    | "DriverEnRoute"
    | "DriverArrived"
    | "RideInProgress"
    | "RideCompleted"
  >("WaitingForRide");

  // the user's location when the ride was requested
  // could be the pickup location if the user clicked
  // "Current Location" on the ride request form
  const [startLocation, setStartLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });
  // A number between 0 and 1 that represents the progress of the user
  const [walkProgress, setWalkProgress] = useState(0);
  // A number between 0 and 1 that represents the progress of the
  // ride from the pickup location to the dropoff location
  const [rideProgress, setRideProgress] = useState(0);

  const routeToPickup = createOpenLink({
    travelType: "walk",
    start: walkAddress,
    end: pickUpAddress,
  });

  // when the user clicks the go-home button
  // reset all fields to their default values and go back to the ride request form
  const goHome = () => {
    setWhichComponent("rideReq");
    resetAllFields();
  };

  /* LEGEND STATE */
  const { height } = useWindowDimensions();
  const [bottom, setBottom] = useState(Math.round(height * 0.41));

  /* EFFECTS */
  useEffect(() => {
    // add the websocket listeners
    WebSocketService.addListener(handleProfileResponse, "PROFILE");
    WebSocketService.addListener(handleLocation, "LOCATION");
    WebSocketService.addListener(handleRequestRide, "REQUEST_RIDE");
    WebSocketService.addListener(handleAccept, "ACCEPT_RIDE");
    WebSocketService.addListener(handleCompleteOrCancel, "CANCEL");
    WebSocketService.addListener(handleCompleteOrCancel, "COMPLETE");
    WebSocketService.addListener(handleWaitTime, "WAIT_TIME");
    WebSocketService.addListener(handleDistance, "DISTANCE");
    WebSocketService.addListener(
      handleRecentLocationResponse,
      "RECENT_LOCATIONS"
    );

    // get the user's profile on first render
    sendProfile();
    // get the user's locations on first render
    sendRecentLocation();
  }, []);

  // logic that should happen when the component FIRST changes
  // currently only handles wait time when the confirm ride component is shown
  useEffect(() => {
    // when we are trying to show confirm ride component, get the ride duration and driver ETA
    if (whichComponent == "confirmRide") {
      // get the ride duration and driver ETA
      WebSocketService.send({
        directive: "WAIT_TIME",
        requestedRide: {
          pickUpLocation,
          dropOffLocation,
        },
      });
      // find out how long it will take to walk
      WebSocketService.send({
        directive: "DISTANCE",
        origin: [userLocation],
        destination: [pickUpLocation],
        mode: "walking",
        tag: "walkToPickup",
      });
    } else if (whichComponent == "handleRide") {
      // if we are handling the ride, check if walking is needed by setting start location
      setStartLocation(userLocation);

      if (isSameLocation(userLocation, pickUpLocation)) {
        setWalkProgress(1);
      }
    }
  }, [whichComponent]);

  // if the component shown is handleRide,
  // everytime a location changes, check the wait time and walking/ride progress
  // to update the progress bar
  useEffect(() => {
    if (whichComponent == "handleRide") {
      switch (rideStatus) {
        case "WaitingForRide":
          // update the walking progress if the pickup Location was not the user's starting location
          if (startLocation.latitude != 0 && startLocation.longitude != 0) {
            // there is a large enough distance that the user needs to walk
            // calculate the progress of the user walking to the pickup location
            if (isSameLocation(userLocation, pickUpLocation)) {
              setWalkProgress(1);
            } else {
              const wp = calculateProgress(
                startLocation,
                userLocation,
                pickUpLocation
              );
              setWalkProgress(wp);
            }
          }
          // if the last time we checked the driverETA (which represented our place in the queue * 15),
          // it was not 0, we are not first in queue.
          if (driverETA !== 0) {
            // then we can check whether the request is advancing in the queue
            // use the request id to check the status of the ride in the queue
            WebSocketService.send({
              directive: "WAIT_TIME",
              requestid,
              requestedRide: {
                pickUpLocation,
                dropOffLocation,
              },
            });
          }
          break;
        case "DriverEnRoute":
          // update the walking progress if the pickup Location was not the user's starting location
          if (startLocation.latitude != 0 && startLocation.longitude != 0) {
            // there is a large enough distance that the user needs to walk
            // calculate the progress of the user walking to the pickup location
            if (isSameLocation(userLocation, pickUpLocation)) {
              setWalkProgress(1);
            } else {
              const wp = calculateProgress(
                startLocation,
                userLocation,
                pickUpLocation
              );
              setWalkProgress(wp);
            }
          }

          // the driver has accepted the ride  and they are on their way
          // check if the driver has arrived at the pickup location
          if (isSameLocation(driverLocation, pickUpLocation)) {
            setRideStatus("DriverArrived");
          } else {
            // else check their ETA in reaching the student
            WebSocketService.send({
              directive: "WAIT_TIME",
              driverLocation,
              requestid,
              requestedRide: {
                pickUpLocation,
                dropOffLocation,
              },
            });
          }
          break;
        case "DriverArrived":
          // driver arrived. hopefully walk progress is 1
          break;
        case "RideInProgress":
          // if the ride is currently happening
          // walk progress should be set to 1
          setWalkProgress(1);

          // update the progress of the ride
          setRideProgress(
            calculateProgress(pickUpLocation, driverLocation, dropOffLocation)
          );

          // check if the driver has reached the dropoff location
          if (isSameLocation(driverLocation, dropOffLocation)) {
            setRideStatus("RideCompleted");
            setRideProgress(1); // set the ride progress to 1 to show the user they have arrived
          }
          break;
        case "RideCompleted":
          // the ride is completed
          break;
        default:
          break;
      }
    }
  }, [userLocation, driverLocation, driverETA]);

  /* WEBSOCKET HANDLERS */
  // WEBSOCKET -- PROFILE
  // request the profile of the user using netid
  const sendProfile = async () => {
    WebSocketService.send({ directive: "PROFILE", netid });
  };
  // set our user state to the user profile we received
  const handleProfileResponse = (message: WebSocketResponse) => {
    if (message.response === "PROFILE") {
      setUser(message.user as User);
    } else {
      // something went wrong
      console.log("Profile response error: ", message);
    }
  };

  // WEBSOCKET -- RECENT_LOCATION
  const sendRecentLocation = async () => {
    WebSocketService.send({
      directive: "RECENT_LOCATIONS",
      netid: netid,
    });
  };

  const handleRecentLocationResponse = (message: WebSocketResponse) => {
    if (message.response === "RECENT_LOCATIONS") {
      setRecentLocations(message.locations as LocationType[]);
    } else {
      // something went wrong
      console.log("Recent location response error: ", message);
    }
  };

  // WEBSOCKET -- LOCATION
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
    } else {
      // something went wrong
      console.log("Location response error: ", message);
    }
  };

  // WEBSOCKET -- CANCEL / COMPLETE RIDE
  // handle the case when the ride is completed or canceled
  const handleCompleteOrCancel = (message: WebSocketResponse) => {
    if (
      "response" in message &&
      (message.response === "COMPLETE" || message.response === "CANCEL")
    ) {
      resetAllFields();
      // go back to ride request component
      setWhichComponent("rideReq");

      // set the notif state based on the reason for cancellation
      if (cancelReason.current === "button") {
        // show the notification based on the response
        if (message.response === "CANCEL") {
          setNotifState({
            text: "Ride successfully canceled",
            color: "#FFCBCB",
            boldText: "canceled",
          });
        } else {
          setNotifState({
            text: "Ride successfully completed!",
            color: "#C9FED0",
            boldText: "completed",
          });
        }
      } else {
        setNotifState({
          text: "Your ride was canceled— timer ran out",
          color: "#FFCBCB",
          boldText: "canceled",
        });
      }
    }
  };

  const resetAllFields = () => {
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
    setPickUpLocationName("");
    setDropOffLocationName("");
    setNumPassengers(1);
    setRequestID("");
    setPickUpAddress("");
    setDropOffAddress("");
    setWalkAddress("");
    setWalkDuration(0);
    setRideDuration(0);
    setDriverETA(0);
    setStartLocation({
      latitude: 0,
      longitude: 0,
    });

    // set walk progress back to 0
    setWalkProgress(0);
    // set ride progress back to 0
    setRideProgress(0);
  };

  // WEBSOCKET -- REQUEST RIDE
  // handle a reponse from the server when we requested a ride
  const handleRequestRide = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "REQUEST_RIDE") {
      // save the request id
      const reqMessage = message as RequestRideResponse;
      setRequestID(reqMessage.requestid);

      // set the startLocation to figure out if the user needs to walk
      setStartLocation(userLocation);

      // set the component to show to WaitingForRide version of handleRide
      setWhichComponent("handleRide");
      setRideStatus("WaitingForRide");

      // show notification
      setNotifState({
        text: "Ride successfully requested",
        color: "#C9FED0",
        boldText: "requested",
      });
    } else {
      const errorMessage = message as ErrorResponse;
      console.log("Request ride error: ", message);
      setNotifState({
        text: errorMessage.error,
        color: "#FFCBCB",
        boldText: "error",
      });
      // go back to request ride
      setWhichComponent("rideReq");
    }
  };

  // WEBSOCKET -- ACCEPT RIDE
  // handle a notification from the server that the ride has been accepted
  const handleAccept = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "ACCEPT_RIDE") {
      // we should already be showing the handleRide component
      // set the ride status to DriverEnRoute
      setRideStatus("DriverEnRoute");
    } else {
      console.log("Accept ride error: ", message);
    }
  };

  // WEBSOCKET -- WAIT TIME
  // handle the wait time response from the server
  const handleWaitTime = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "WAIT_TIME") {
      const waitTimeresp = message as WaitTimeResponse;
      // extract the ride duration
      setRideDuration(waitTimeresp.rideDuration as number);
      // extract the driver ETA
      setDriverETA(waitTimeresp.driverETA as number);
      setPickUpAddress(waitTimeresp.pickUpAddress as string);
      setDropOffAddress(waitTimeresp.dropOffAddress as string);
    } else {
      console.log("Wait time response error: ", message);
    }
  };

  // WEBSOCKET -- DISTANCE
  const handleDistance = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "DISTANCE") {
      const distanceResp = message as DistanceResponse;
      if (distanceResp.tag === "walkToPickup") {
        const walkSeconds =
          distanceResp.apiResponse.rows[0].elements[0].duration.value;
        setWalkDuration(Math.floor(walkSeconds / 60)); // convert seconds to minutes
        setWalkAddress(distanceResp.apiResponse.origin_addresses[0]);
      }
    } else {
      console.log("Distance response error: ", message);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View>
        {/* map component */}
        <Map
          ref={mapRef}
          pickUpLocation={pickUpLocation}
          dropOffLocation={dropOffLocation}
          driverLocation={driverLocation}
          userLocationChanged={userLocationChanged}
          status={rideStatus}
        />
        {/* profile pop-up modal */}
        <View style={styles.modalContainer}>
          <Profile
            isVisible={profileVisible}
            onClose={() => setProfileVisible(false)}
            user={user}
          />
        </View>
        {/* profile button in top left corner*/}
        <View
          style={{
            position: "absolute",
            paddingVertical: 50,
            paddingHorizontal: 20,
            width: "100%",
            height: "100%",
            shadowOpacity: 0.5,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 1 },
            shadowColor: "grey",
            pointerEvents: "box-none",
          }}
        >
          <TouchableOpacity
            style={{ width: 35, height: 35 }}
            onPress={() => setProfileVisible(true)}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 100,
              }}
            >
              <Ionicons name="person-circle" size={35} color="#4B2E83" />
            </View>
          </TouchableOpacity>
        </View>

        {/* faq pop-up modal */}
        <View style={[styles.modalContainer, {bottom: 0}]}>
          <FAQ isVisible={FAQVisible} onClose={() => setFAQVisible(false)} />
        </View>
        {/* notification component */}
        <View
          style={{ position: "absolute", top: 0, width: "100%", zIndex: 100 }}
        >
          {notifState.text != "" && (
            <Notification
              text={notifState.text}
              color={notifState.color}
              boldText={notifState.boldText}
            />
          )}
        </View>

        {/* Side Bar */}
        <View
          style={{
            position: "absolute",
            bottom:
              whichComponent == "waitForRide" || whichComponent == "handleRide"
                ? Math.round(height * 0.41)
                : bottom,
            left: 10,
            alignItems: "flex-start",
          }}
        >
          {/* Recenter Button */}
          <Pressable
            style={{
              backgroundColor: "#4b2e83",
              width: 35,
              height: 35,
              borderRadius: 50,
              borderWidth: 3,
              borderColor: "white",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 10,
              shadowOpacity: 0.3,
              left: 2,
            }}
            onPress={recenter}
          >
            <Ionicons name="locate" size={20} color="white" />
          </Pressable>

          {/* Side map legend */}
          <Legend />
        </View>

        {/* Figure out which component to render */}
        {
          whichComponent === "rideReq" ? (
            <View style={styles.homePageComponentContainer}>
              {/* ride request form component */}
              <RideRequestForm
                pickUpLocationNameChanged={setPickUpLocationName}
                dropOffLocationNameChanged={setDropOffLocationName}
                pickUpLocationCoordChanged={setPickUpLocation}
                dropOffLocationCoordChanged={setDropOffLocation}
                userLocation={userLocation}
                rideRequested={rideRequested}
                startingState={startingState}
                setFAQVisible={setFAQVisible}
                recentLocations={recentLocations}
                setNotificationState={setNotifState}
                updateSideBarHeight={setBottom}
              />
            </View>
          ) : whichComponent === "confirmRide" ? (
            <View style={styles.homePageComponentContainer}>
              {/* confirm ride component */}
              <ConfirmRide
                pickUpLoc={pickUpLocationName}
                dropOffLoc={dropOffLocationName}
                rideDuration={rideDuration}
                walkDuration={walkDuration}
                driverETA={driverETA}
                numPassengers={numPassengers}
                onClose={closeConfirmRide}
                onConfirm={requestRide}
                setFAQVisible={setFAQVisible}
              />
            </View>
          ) : whichComponent === "Loading" ? (
            <View style={styles.homePageComponentContainer}>
              {/* loading page component */}
              <LoadingPageComp
                pickUpLoc={pickUpLocationName}
                dropOffLoc={dropOffLocationName}
                numPassengers={numPassengers}
              />
            </View>
          ) : whichComponent === "handleRide" ? (
            <View style={styles.homePageComponentContainer}>
              {/* driver on way component */}
              <HandleRideComponent
                status={rideStatus}
                walkProgress={walkProgress}
                rideProgress={rideProgress}
                pickUpLocation={pickUpLocationName}
                dropOffLocation={dropOffLocationName}
                pickUpAddress={pickUpAddress}
                dropOffAddress={dropOffAddress}
                walkDuration={walkDuration}
                driverETA={driverETA}
                rideDuration={rideDuration}
                onCancel={cancelRide}
                setFAQVisible={setFAQVisible}
                openNavigation={routeToPickup}
                setNotificationState={setNotifState}
                changeRideStatus={setRideStatus}
                goHome={goHome}
              />
            </View>
          ) : null // default
        }
      </View>
    </GestureHandlerRootView>
  );
}

/**
 * Helper function to calculate the progress of the user walking to the pickup location
 * or the progress of the ride from the pickup location to the dropoff location

 * @param start 
 * @param current 
 * @param dest 
 * @returns 
 */
const calculateProgress = (
  start: { latitude: number; longitude: number },
  current: { latitude: number; longitude: number },
  dest: { latitude: number; longitude: number }
): number => {
  // calculate the distance between the two coordinates
  const distance = calculateDistance(start, dest);
  // the distance between the current location and the destination
  // is the remaining distance to the destination
  // use this to calc progress because the user may not be
  // walking in a straight line from the start location
  const remaining = calculateDistance(current, dest);
  const currentDistance = distance - remaining;
  return currentDistance / distance; // remaining distance
};
