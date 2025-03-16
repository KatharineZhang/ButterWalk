/* eslint-disable @typescript-eslint/no-require-imports */
import { useState, useEffect } from "react";
import { Text, Image, TouchableOpacity, View } from "react-native";
import Profile from "./profile";
import Map from "./map";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import {
  LocationResponse,
  User,
  WaitTimeResponse,
  WebSocketResponse,
} from "../../../server/src/api";
import RideRequestForm, {
  ValidLocationType,
} from "@/components/RideRequestForm";
import { LocationName, LocationService } from "@/services/LocationService";
import WaitingForRide from "@/components/WaitingForRide";
import ConfirmRide from "@/components/ConfirmRide";

export default function HomePage() {
  /* GENERAL HOME PAGE STATE AND METHODS */
  const { netid } = useLocalSearchParams<{ netid: string }>();

  const [rideStatus, setRideStatus] = useState<
    | "NONE"
    | "REQUESTED"
    | "ACCEPTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
  >("NONE");

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
    if (rideStatus === "ACCEPTED") {
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

  /* LOADING / WAITFORRIDE / DRIVERONWAY STATE AND METHODS */
  const cancelRide = () => {
    // call cancel route
    WebSocketService.send({ directive: "CANCEL", netid, role: "STUDENT" });
  };

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

  // figure out coordinates from picku and dropoff locations
  useEffect(() => {
    console.log(pickUpLocationName, dropOffLocationName);
    if (pickUpLocationName === "Current Location") {
      // we were given user coordinates not a location name
      console.log("Pickup location is coordinates");
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
      console.log(user);
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
      console.log("here");
      // set the ride status to requested
      setRideStatus("REQUESTED");
      // set the component to show to waiting for ride
      setWhichComponent("waitForRide");
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
      setRideStatus("ACCEPTED");
      setWhichComponent("driverOnWay");
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
          <Image
            source={require("@/assets/images/profile.png")}
            style={{ width: 35, height: 35, zIndex: 1 }}
          />
        </TouchableOpacity>
      </View>

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
        ) : whichComponent === "waitForRide" ? (
          <View style={{ position: "absolute", width: "100%", height: "100%" }}>
            {/* waiting for ride component */}
            <WaitingForRide driverETA={driverETA} onCancel={cancelRide} />
          </View>
        ) : whichComponent === "driverOnWay" ? (
          <View>
            {/* driver on way component */}
            {/* Example: <DriverOnWay 
            pickUpLocation={pickUpLocation}
            dropOffLocation={dropOffLocation}
            driverLocation={driverLocation}
            cancelRide={cancelRide}
          /> */}
          </View>
        ) : null // default
      }
    </View>
  );
}
