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
import RideProgressBar from "@/components/RideProgressBar";
import FAQ from "./faq";
import { Ionicons } from "@expo/vector-icons";

export default function HomePage() {
  /* GENERAL HOME PAGE STATE AND METHODS */
  const { netid } = useLocalSearchParams<{ netid: string }>();
  // FAQ State
  const [FAQVisible, setFAQVisible] = useState(false);

  const [whichComponent, setWhichComponent] = useState<
    "rideReq" | "confirmRide" | "Loading" | "waitForRide" | "driverOnWay"
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
  const [pickUpLocationName, setPickUpLocationName] =
    useState<ValidLocationType>("" as ValidLocationType);
  const [dropOffLocationName, setDropOffLocationName] =
    useState<ValidLocationType>("" as ValidLocationType);
  const [numPassengers, setNumPassengers] = useState(1);

  // user clicked on request ride button on ride request form
  const rideRequested = (numPassengers: number) => {
    setNumPassengers(numPassengers);
    setWhichComponent("confirmRide");
  };

  /* PROFILE STATE AND METHODS */
  const [profileVisible, setProfileVisible] = useState(false);
  const [user, setUser] = useState<User>({} as User);

  /* CONFIRM RIDE STATE AND METHODS */
  const [rideDuration, setRideDuration] = useState(0);
  const [driverETA, setDriverETA] = useState(0);
  const [startingState, setStartingState] = useState<
    { pickup: string; dropoff: string; numRiders: number } | undefined
  >(undefined);
  const [requestid, setRequestID] = useState("");

  const closeConfirmRide = () => {
    setWhichComponent("rideReq");
    setStartingState({
      pickup: pickUpLocationName,
      dropoff: dropOffLocationName,
      numRiders: numPassengers,
    });
  };

  const requestRide = async () => {
    // send the ride request to the server
    WebSocketService.send({
      directive: "REQUEST_RIDE",
      phoneNum: user.phoneNumber as string,
      netid,
      location: JSON.stringify(pickUpLocation),
      destination: JSON.stringify(dropOffLocation),
      numRiders: numPassengers,
    });
    // set the component to show to loading
    setWhichComponent("Loading");
  };

  /* DRIVER ON WAY STATE */
  const cancelRide = () => {
    // call cancel route
    WebSocketService.send({ directive: "CANCEL", netid, role: "STUDENT" });
  };
  const [rideStatus, setRideStatus] = useState<
    | "WaitingForRide"
    | "DriverEnRoute"
    | "DriverArrived"
    | "RideInProgress"
    | "RideCompleted"
  >("WaitingForRide");

  const [startLocation, setStartLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });
  const [walkProgress, setWalkProgress] = useState(-1);
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

  useEffect(() => {
    // when we are trying to show confirm ride component, get the ride duration and driver ETA
    if (whichComponent == "confirmRide") {
      // get the ride duration and driver ETA
      WebSocketService.send({
        directive: "WAIT_TIME",
        requestedRide: {
          pickupLocation: pickUpLocation,
          dropOffLocation,
        },
      });
    }
  }, [whichComponent]);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("checking wait time and progress every minute");

      if (whichComponent == "driverOnWay") {
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

        if (driverLocation.latitude == 0 && driverLocation.longitude == 0) {
          // the ride has been requested, get the wait time
          // to see if the request is advancing in the queue
          if (driverETA !== 0) {
            // we are not first in queue
            WebSocketService.send({
              directive: "WAIT_TIME",
              requestid,
              requestedRide: {
                pickupLocation: pickUpLocation,
                dropOffLocation,
              },
            });
          }
        } else {
          // the driver has accepted, see their progress in reaching the student
          WebSocketService.send({
            directive: "WAIT_TIME",
            driverLocation,
            requestid,
            requestedRide: {
              pickupLocation: pickUpLocation,
              dropOffLocation,
            },
          });
        }
      }
    }, 60000);
    // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
    return () => clearInterval(interval);
  }, [startLocation]);

  // figure out coordinates from pickup and dropoff locations
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

  /* WEBSOCKET HANDLERS */
  // WEBSOCKET -- PROFILE
  const sendProfile = async () => {
    WebSocketService.send({ directive: "PROFILE", netid });
  };
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

      // check if the driver has arrived (the driver is a negligible distance from the pickup location)
      if (
        driverResp.latitude - pickUpLocation.latitude < 0.0001 &&
        driverResp.longitude - pickUpLocation.longitude < 0.0001
      ) {
        setRideStatus("DriverArrived");
      }

      if (rideStatus == "RideInProgress") {
        // if the ride is happening check how much of it is done
        setRideProgress(
          calculateProgress(pickUpLocation, driverLocation, dropOffLocation)
        );

        // if the ride is currently happening, check if the driver has reached the dropoff location
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

      // go back to ride request componenet
      setWhichComponent("rideReq");
    }
  };

  // WEBSOCKET -- REQUEST RIDE
  const handleRequestRide = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "REQUEST_RIDE") {
      const reqMessage = message as RequestRideResponse;
      setRequestID(reqMessage.requestid);
      // set the component to show to waiting for ride version of driverOnWay
      setWhichComponent("driverOnWay");
      setRideStatus("WaitingForRide");
      // start the walking
      setStartLocation(userLocation);
    } else {
      console.log("Request ride error: ", message);
      // go back to request ride
      setWhichComponent("rideReq");
    }
  };

  // WEBSOCKET -- ACCEPT RIDE
  const handleAccept = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "ACCEPT_RIDE") {
      // set the ride status to accepted
      setWhichComponent("driverOnWay");
      setRideStatus("DriverEnRoute");
    } else {
      console.log("Accept ride error: ", message);
    }
  };

  // WEBSOCKET -- WAIT TIME
  const handleWaitTime = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "WAIT_TIME") {
      const waitTimeresp = message as WaitTimeResponse;
      setRideDuration(waitTimeresp.rideDuration as number);
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
        rideDuration={rideDuration}
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
        }}
      >
        <TouchableOpacity onPress={() => setProfileVisible(true)}>
          <View
            style={{
              backgroundColor: "white",
              width: "10%",
              height: "22%",
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
          <View style={{ position: "absolute", width: "100%", height: "100%" }}>
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
          <View style={{ position: "absolute", width: "100%", height: "100%" }}>
            {/* confirm ride component */}
            <ConfirmRide
              pickUpLoc={pickUpLocationName}
              dropOffLoc={dropOffLocationName}
              driverETA={driverETA}
              numPassengers={numPassengers}
              onClose={closeConfirmRide}
              onConfirm={requestRide}
              setFAQVisible={setFAQVisible}
            />
          </View>
        ) : whichComponent === "Loading" ? (
          <View
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "white",
            }}
          >
            <View style={{ height: 100 }} />
            <Text>Loading...</Text>
            {/* loading component */}
            {/* Example: <Loading 
            pickUpLocation={pickUpLocation}
            dropOffLocation={dropOffLocation}
            cancelRide={cancelRide}
            /> */}
          </View>
        ) : whichComponent === "driverOnWay" ? (
          <View style={{ position: "absolute", width: "100%", height: "100%" }}>
            {/* waiting for ride component */}
            <RideProgressBar
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
