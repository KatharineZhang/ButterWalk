import { useState, useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Profile from "./profile";
import Map, { calculateDistance } from "./map";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import {
  LocationResponse,
  RequestRideResponse,
  User,
  WaitTimeResponse,
  WebSocketResponse,
} from "../../../server/src/api";
import RideRequestForm, {
  ValidLocationType,
} from "@/components/RideRequestForm";
import { LocationName, LocationService } from "@/services/LocationService";
import ConfirmRide from "@/components/ConfirmRide";
import FAQ from "./faq";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/assets/styles";
import HandleRideComponent from "@/components/HandleRideComp";

export default function HomePage() {
  /* GENERAL HOME PAGE STATE AND METHODS */
  const { netid } = useLocalSearchParams<{ netid: string }>();
  // FAQ State
  const [FAQVisible, setFAQVisible] = useState(false);
  // which bottom component to show
  const [whichComponent, setWhichComponent] = useState<
    "rideReq" | "confirmRide" | "Loading" | "waitForRide" | "handleRide"
  >("rideReq");

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
  const [pickUpLocationName, setPickUpLocationName] =
    useState<ValidLocationType>("" as ValidLocationType);
  const [dropOffLocationName, setDropOffLocationName] =
    useState<ValidLocationType>("" as ValidLocationType);
  const [numPassengers, setNumPassengers] = useState(1);

  // user clicked on request ride button on ride request form
  // we want to show the confirm ride component
  const rideRequested = (numPassengers: number) => {
    setNumPassengers(numPassengers);
    setWhichComponent("confirmRide");
  };

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
      location: pickUpLocationName,
      destination: dropOffLocationName,
      numRiders: numPassengers,
    });
    // set the component to show to loading
    setWhichComponent("Loading");
  };

  /* HANDLE RIDE STATE */
  // the user wishes to cancel the ride
  // we want to send a cancel request to the server
  const cancelRide = () => {
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
  // walking to the pickup location will be -1 if the user clicked
  // "Current Location" on the ride request form
  // and therefore will not need to walk
  const [walkProgress, setWalkProgress] = useState(-1);
  // A number between 0 and 1 that represents the progress of the
  // ride from the pickup location to the dropoff location
  const [rideProgress, setRideProgress] = useState(0);

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

    // get the user's profile on first render
    sendProfile();
  }, []);

  // figure out coordinates from pickup and dropoff location names
  // clicked in the ride request form
  useEffect(() => {
    if (pickUpLocationName === "Current Location") {
      // we were given user coordinates not a location name
      setPickUpLocation(userLocation);
    } else {
      // get the coordinates of the pickup location
      setPickUpLocation(
        LocationService.getLatAndLong(pickUpLocationName as LocationName)
      );
    }

    if (dropOffLocationName != ("" as ValidLocationType)) {
      // get the coordinates of the dropoff location
      setDropOffLocation(
        LocationService.getLatAndLong(dropOffLocationName as LocationName)
      );
    }
  }, [pickUpLocationName, dropOffLocationName]);

  // logic that should happen when the component changes
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
    }
  }, [whichComponent]);

  // if the component shown is handleRide,
  // check the wait time and walking/ride progress every minute
  // to update the progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("checking wait time and progress every minute");

      if (whichComponent == "handleRide") {
        // update the walking progress if the pickup Location was not the user's location
        if (
          startLocation.latitude != 0 &&
          calculateDistance(startLocation, pickUpLocation) > 0.01
        ) {
          // there is a large enough distance that the user needs to walk
          setWalkProgress(
            calculateProgress(startLocation, userLocation, pickUpLocation)
          );
        }

        // a driver has not accepted, but if we are on the handleRide component
        // we know a ride has been requested
        // use the request id to check the status of the ride in the queue
        if (driverLocation.latitude == 0 && driverLocation.longitude == 0) {
          // the ride has been requested, get the wait time
          // to see if the request is advancing in the queue
          if (driverETA !== 0) {
            // if the last time we checked the driverETA (which represented our place in the queue * 15),
            // it was not 0 (we are not first in queue)
            // then we can check whether the request is advancing in the queue
            WebSocketService.send({
              directive: "WAIT_TIME",
              requestid,
              requestedRide: {
                pickUpLocation,
                dropOffLocation,
              },
            });
          }
        } else {
          // the driver has accepted our ride, check their progress in reaching the student
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
      }
    }, 60000);
    // This represents the unmount function,
    // in which you need to clear your interval to prevent memory leaks.
    return () => clearInterval(interval);
  }, [startLocation]);

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

      // check if the driver has arrived at the pickup locatio
      // (aka the driver is a negligible distance from the pickup location)
      if (
        driverResp.latitude - pickUpLocation.latitude < 0.0001 &&
        driverResp.longitude - pickUpLocation.longitude < 0.0001
      ) {
        setRideStatus("DriverArrived");
      }

      // if the ride is currently happening
      if (rideStatus == "RideInProgress") {
        // check the progress of the ride
        setRideProgress(
          calculateProgress(pickUpLocation, driverLocation, dropOffLocation)
        );

        // check if the driver has reached the dropoff location
        if (
          driverResp.latitude - dropOffLocation.latitude < 0.0001 &&
          driverResp.longitude - dropOffLocation.longitude < 0.0001
        ) {
          setRideStatus("RideCompleted");
        }
      }
    }
  };

  // WEBSOCKET -- CANCEL / COMPLETE RIDE
  // handle the case when the ride is completed or cancelled
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

      // go back to ride request component
      setWhichComponent("rideReq");
    }
  };

  // WEBSOCKET -- REQUEST RIDE
  // handle a reponse from the server when we requested a ride
  const handleRequestRide = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "REQUEST_RIDE") {
      // save the request id
      const reqMessage = message as RequestRideResponse;
      setRequestID(reqMessage.requestid);

      // set the component to show to WaitingForRide version of handleRide
      setWhichComponent("handleRide");
      setRideStatus("WaitingForRide");

      // set the startLocation to figure out if the user needs to walk
      setStartLocation(userLocation);
    } else {
      console.log("Request ride error: ", message);
      // go back to request ride
      setWhichComponent("rideReq");
    }
  };

  // WEBSOCKET -- ACCEPT RIDE
  // handle a notification from the server that the ride has been accepted
  const handleAccept = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "ACCEPT_RIDE") {
      // we should already be showing the handleRide component
      // but make sure we are showing it
      setWhichComponent("handleRide");
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
    } else {
      console.log("Wait time response error: ", message);
    }
  };

  return (
    <View>
      {/* map component */}
      <Map
        pickUpLocation={pickUpLocation}
        dropOffLocation={dropOffLocation}
        driverLocation={driverLocation}
        userLocationChanged={userLocationChanged}
      />
      {/* profile pop-up modal */}
      <Profile
        isVisible={profileVisible}
        onClose={() => setProfileVisible(false)}
        user={user}
      />
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
      <FAQ isVisible={FAQVisible} onClose={() => setFAQVisible(false)} />

      {/* Figure out which component to render */}
      {
        whichComponent === "rideReq" ? (
          <View style={styles.homePageComponentContainer}>
            {/* ride request form component */}
            <RideRequestForm
              pickUpLocationChanged={setPickUpLocationName}
              dropOffLocationChanged={setDropOffLocationName}
              userLocation={userLocation}
              rideRequested={rideRequested}
              startingState={startingState}
              setFAQVisible={setFAQVisible}
            />
          </View>
        ) : whichComponent === "confirmRide" ? (
          <View style={styles.homePageComponentContainer}>
            {/* confirm ride component */}
            <ConfirmRide
              pickUpLoc={pickUpLocationName}
              dropOffLoc={dropOffLocationName}
              rideDuration={rideDuration}
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
            {/* TODO: REPLACE WITH ACTUAL PAGE */}
            <View style={{ backgroundColor: "white", height: 100 }} />
            <Text>Loading...</Text>
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
              driverETA={driverETA}
              rideDuration={rideDuration}
              onCancel={cancelRide}
              setFAQVisible={setFAQVisible}
            />
          </View>
        ) : null // default
      }
    </View>
  );
}

// Helper function to calculate the progress of the user walking to the pickup location
// or the progress of the ride from the pickup location to the dropoff location
const calculateProgress = (
  start: { latitude: number; longitude: number },
  current: { latitude: number; longitude: number },
  dest: { latitude: number; longitude: number }
): number => {
  // calculate the distance between the two coordinates
  const distance = calculateDistance(start, dest);
  const currentDistance = calculateDistance(start, current);
  return 1 - currentDistance / distance; // remaining distance
};
