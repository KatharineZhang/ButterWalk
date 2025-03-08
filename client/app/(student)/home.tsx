/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useState, useEffect } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import Profile from "./profile";
import Map from "./map";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import {
  LocationResponse,
  User,
  WebSocketResponse,
} from "../../../server/src/api";

export default function HomePage() {
  /* GENERAL HOME PAGE STATE AND METHODS */
  const { netid } = useLocalSearchParams<{ netid: string }>();
  // TODO: remove this once auth is merged
  WebSocketService.connect(netid as string, "STUDENT");

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

  const rideRequested = () => {
    setWhichComponent("confirmRide");
  };

  /* PROFILE STATE AND METHODS */
  const [profileVisible, setProfileVisible] = useState(false);
  const [user, setUser] = useState<User>({} as User);

  /* CONFIRM RIDE STATE AND METHODS */
  const [numberPassengers, setNumberPassengers] = useState(1);

  const requestRide = async (requestedPassengers: number) => {
    // set # of passengers
    setNumberPassengers(requestedPassengers);
    // send the ride request to the server
    WebSocketService.send({
      directive: "REQUEST_RIDE",
      phoneNum: user.phoneNumber,
      netid,
      location: "location",
      destination: "destination",
      numRiders: requestedPassengers,
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

    // get the user's profile on first render
    sendProfile();
  }, []);

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

  return (
    <View>
      {/* map component */}
      <Map
        pickUpLocation={pickUpLocation}
        dropOffLocation={dropOffLocation}
        driverLocation={driverLocation}
        userLocationChanged={userLocationChanged}
      />
      {/* ride request drawer HIBA */}
      {/* Example: <RideRequestDrawer
        setPickUpLocation={setPickUpLocation}
        setDropOffLocation={setDropOffLocation}
        setRideRequested={setRideRequested}
        setRideConfirmed={setRideConfirmed}
        netid={netid}
      /> */}

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
          <View>
            {/* ride request component */}
            {/* Example: <RideRequest
            requestRide={requestRide}
            setNumberPassengers={setNumberPassengers}
          /> */}
          </View>
        ) : whichComponent === "confirmRide" ? (
          <View>
            {/* confirm ride component */}
            {/* Example: <ConfirmRide
            pickUpLocation={pickUpLocation}
            dropOffLocation={dropOffLocation}
            rideConfirmed={rideConfirmed}
          /> */}
          </View>
        ) : whichComponent === "Loading" ? (
          <View>
            {/* loading component */}
            {/* Example: <Loading 
            pickUpLocation={pickUpLocation}
            dropOffLocation={dropOffLocation}
            cancelRide={cancelRide}
            /> */}
          </View>
        ) : whichComponent === "waitForRide" ? (
          <View>
            {/* waiting for ride component */}
            {/* Example: <WaitingForRide cancelRide={cancelRide} /> */}
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
