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
  CancelResponse,
  DistanceResponse,
  ErrorResponse,
  LocationResponse,
  LocationType,
  ProfileResponse,
  RequestRideResponse,
  User,
  WaitTimeResponse,
  WebSocketResponse,
} from "../../../server/src/api";
import RideRequestForm from "@/components/Student_RideRequestForm";
import ConfirmRide from "@/components/Student_ConfirmRide";
import Notification, { NotificationType } from "@/components/Both_Notification";
import FAQ from "./faq";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/assets/styles";
import HandleRideComponent from "@/components/Student_HandleRide";
import { createOpenLink } from "react-native-open-maps";
import LoadingPageComp from "@/components/Student_LoadingPage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Legend from "@/components/Student_Legend";

export default function HomePage() {
  /* GENERAL HOME PAGE STATE AND METHODS */
  const { netid } = useLocalSearchParams<{ netid: string }>();
  // FAQ State
  const [FAQVisible, setFAQVisible] = useState(false);
  // which bottom component to show
  const [whichComponent, setWhichComponent] = useState<
    "rideReq" | "confirmRide" | "Loading" | "handleRide"
  >("rideReq");

  // what notification to show
  const [notifState, setNotifState] = useState<NotificationType>({
    text: "",
    color: "",
    boldText: "",
    trigger: 0,
  });

  /* MAP STATE AND METHODS */
  // the student's location (don't need userLocation variable)
  const [, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });
  const userLocationRef = useRef<{
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
    setUserLocation(location); // trigger rerender when the user's location changes
    userLocationRef.current = location; // actually store the state for use
    // if the ride has been accepted, send the new location to the driver
    if (rideStatusRef.current === "DriverEnRoute") {
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
  const [showRequestLoading, setShowRequestLoading] = useState<boolean>(false);

  // many components use the location name, so we store it here
  const [pickUpLocationName, setPickUpLocationName] = useState<string>("");
  const [dropOffLocationName, setDropOffLocationName] = useState<string>("");
  const [numPassengers, setNumPassengers] = useState(1);

  // user clicked on request ride button on ride request form
  // we want to show the confirm ride component
  const rideRequested = (numPassengers: number) => {
    setNumPassengers(numPassengers);
    setShowRequestLoading(true);
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
      origin: [userLocationRef.current],
      destination: [pickUpLocation],
      mode: "walking",
      tag: "walkToPickup",
    });
  };

  // the user's recent locations that will be displayed in the dropdown
  const [recentLocations, setRecentLocations] = useState<LocationType[]>([]);

  // darken the screen when the user clicks on the confirmation modal
  const [darkenScreen, setDarkenScreen] = useState(false);

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

  // the reason could be that:
  // the driver canceled (no action on student side),
  // user clicked the cancel button
  // or the timer ran out
  const cancelReason = useRef<"none" | "button" | "timer">("none");

  // the user wishes to cancel the ride
  // we want to send a cancel request to the server
  const cancelRide = (reason: "button" | "timer") => {
    cancelReason.current = reason; // note what method they used to cancel
    // call cancel route
    WebSocketService.send({ directive: "CANCEL", netid, role: "STUDENT" });
  };

  // show different state in the DriverOneWay component
  // based on the status of the ride
  const [, setRideStatus] = useState<
    | "WaitingForRide"
    | "DriverEnRoute"
    | "DriverArrived"
    | "RideInProgress"
    | "RideCompleted"
  >("WaitingForRide");
  const rideStatusRef = useRef<
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
  // to start, the current component is the ride request form which takes up 40% of the screen height
  const [currentComponentHeight, setCurrentComponentHeight] = useState(
    Math.round(height * 0.4)
  );

  /* EFFECTS */
  useEffect(() => {
    // add the websocket listeners
    WebSocketService.addListener(handleProfileResponse, "PROFILE");
    WebSocketService.addListener(handleLocation, "LOCATION");
    WebSocketService.addListener(handleRequestRide, "REQUEST_RIDE");
    WebSocketService.addListener(handleAccept, "ACCEPT_RIDE");
    WebSocketService.addListener(handleCancel, "CANCEL");
    WebSocketService.addListener(handleComplete, "COMPLETE");
    WebSocketService.addListener(handleWaitTime, "WAIT_TIME");
    WebSocketService.addListener(handleDistance, "DISTANCE");
    WebSocketService.addListener(
      handleDriverArrived,
      "DRIVER_ARRIVED_AT_PICKUP"
    );
    WebSocketService.addListener(
      handleDriverPickedUp,
      "DRIVER_DRIVING_TO_DROPOFF"
    );

    // get the user's profile on first render
    sendProfile();
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
        origin: [userLocationRef.current],
        destination: [pickUpLocation],
        mode: "walking",
        tag: "walkToPickup",
      });
    } else if (whichComponent == "handleRide") {
      // if we are handling the ride, check if walking is needed by setting start location
      setStartLocation(userLocationRef.current);

      if (isSameLocation(userLocationRef.current, pickUpLocation)) {
        setWalkProgress(1);
      }
    }
  }, [whichComponent]);

  // if the component shown is handleRide,
  // everytime a location changes, check the wait time and walking/ride progress
  // to update the progress bar
  useEffect(() => {
    if (whichComponent == "handleRide") {
      switch (rideStatusRef.current) {
        case "WaitingForRide":
          // update the walking progress if the pickup Location was not the user's starting location
          if (startLocation.latitude != 0 && startLocation.longitude != 0) {
            // there is a large enough distance that the user needs to walk
            // calculate the progress of the user walking to the pickup location
            if (isSameLocation(userLocationRef.current, pickUpLocation)) {
              setWalkProgress(1);
            } else {
              const wp = calculateProgress(
                startLocation,
                userLocationRef.current,
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
            if (isSameLocation(userLocationRef.current, pickUpLocation)) {
              setWalkProgress(1);
            } else {
              const wp = calculateProgress(
                startLocation,
                userLocationRef.current,
                pickUpLocation
              );
              setWalkProgress(wp);
            }
          }

          // the driver has accepted the ride  and they are on their way
          // check their ETA in reaching the student
          WebSocketService.send({
            directive: "WAIT_TIME",
            driverLocation,
            requestid,
            requestedRide: {
              pickUpLocation,
              dropOffLocation,
            },
          });
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
          break;
        case "RideCompleted":
          // the ride is completed
          break;
        default:
          break;
      }
    }
  }, [userLocationRef.current, driverLocation, driverETA]);

  /* WEBSOCKET HANDLERS */
  // WEBSOCKET -- PROFILE
  // request the profile of the user using netid
  const sendProfile = async () => {
    WebSocketService.send({ directive: "PROFILE", netid });
  };
  // set our user state to the user profile we received
  const handleProfileResponse = (message: WebSocketResponse) => {
    if (message.response === "PROFILE") {
      const profileMessage = message as ProfileResponse;
      setUser(profileMessage.user as User);
      setRecentLocations(profileMessage.locations as LocationType[]);
    } else {
      // something went wrong
      console.log("Profile response error: ", message);
      setNotifState({
        text: "DEV NOTIF: ProfileError: " + (message as ErrorResponse).error,
        color: "#FFD580",
        trigger: Date.now(),
      });
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
      setNotifState({
        text: "DEV NOTIF: LocationError: " + (message as ErrorResponse).error,
        color: "#FFD580",
        trigger: Date.now(),
      });
    }
  };

  // WEBSOCKET -- CANCEL
  const handleCancel = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "CANCEL") {
      const cancelResp = message as CancelResponse;
      // if we are waiting for the ride, we don't need to know that a driver viewed and canceled on us
      // only notify the student if they previously were told a driver was coming and now they are not
      if (cancelResp.newRideStatus == "REQUESTED") {
        if (rideStatusRef.current != "WaitingForRide") {
          // our ride is back in the queue!
          // set the ride status back to waiting for ride
          // but stay on handle ride component
          rideStatusRef.current = "WaitingForRide";
          setRideStatus("WaitingForRide");
          setNotifState({
            text: "Your driver canceled the ride. Please wait for another driver",
            color: "#FFCBCB",
            trigger: Date.now(),
          });
        }
      } else {
        resetAllFields();
        // go back to ride request component
        setWhichComponent("rideReq");
        // set the notif state based on the reason for cancelation
        switch (cancelReason.current) {
          case "none":
            // if we did not cancel, the driver did
            setNotifState({
              text: "Your driver has canceled this ride.",
              color: "#FFCBCB",
              trigger: Date.now(),
              boldText: "canceled",
            });
            break;
          case "button":
            // we clicked the cancel button
            setNotifState({
              text: "Ride successfully canceled",
              color: "#FFCBCB",
              boldText: "canceled",
              trigger: Date.now(),
            });
            break;
          case "timer":
            // the timer ran out
            setNotifState({
              text: "Your ride was canceled— timer ran out",
              color: "#FFCBCB",
              boldText: "canceled",
              trigger: Date.now(),
            });
            break;
        }
      }
    } else {
      console.log("Cancel Ride error: " + (message as ErrorResponse).error);
      setNotifState({
        text: "DEV NOTIF: CancelRideError: " + (message as ErrorResponse).error,
        color: "#FFD580",
        trigger: Date.now(),
      });
    }
  };

  // WEBSOCKET -- COMPLETE RIDE
  // handle the case when the ride is completed or canceled
  const handleComplete = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "COMPLETE") {
      // wait until we recieve message with the ride completed
      // for us to set the student's ride status to completed
      rideStatusRef.current = "RideCompleted";
      setRideStatus("RideCompleted");
      setRideProgress(1); // set the ride progress to 1 to show the user they have arrived
      setNotifState({
        text: "Ride successfully completed!",
        color: "#C9FED0",
        boldText: "completed",
        trigger: Date.now(),
      });
    }
  };

  // WEBSOCKET -- DRIVER ARRIVED
  // when the driver has clicked the button saying they have arrived at the pickup location
  // notify the user and change the ride status to DriverArrived
  const handleDriverArrived = (message: WebSocketResponse) => {
    if (
      "response" in message &&
      message.response === "DRIVER_ARRIVED_AT_PICKUP"
    ) {
      // the driver has arrived at the pickup location
      rideStatusRef.current = "DriverArrived";
      setRideStatus("DriverArrived");
      // send the user's location in case we haven't move since ride was accepted
      WebSocketService.send({
        directive: "LOCATION",
        id: netid,
        latitude: userLocationRef.current.latitude,
        longitude: userLocationRef.current.longitude,
      });
    } else {
      console.log("Driver arrived response error: ", message);
      setNotifState({
        text:
          "DEV NOTIF: DriverArrivedError: " + (message as ErrorResponse).error,
        color: "#FFD580",
        trigger: Date.now(),
      });
    }
  };

  // WEBSOCKET -- DRIVER CLICKED PICKED UP STUDENT
  const handleDriverPickedUp = (message: WebSocketResponse) => {
    if (
      "response" in message &&
      message.response === "DRIVER_DRIVING_TO_DROPOFF"
    ) {
      // the driver has arrived at the pickup location
      rideStatusRef.current = "RideInProgress";
      setRideStatus("RideInProgress");
      setNotifState({
        text: "You have been picked up and are on your way to your destination!",
        color: "#C9FED0",
        trigger: Date.now(),
      });
    } else {
      console.log("Driver arrived at pickup response error: ", message);
      setNotifState({
        text:
          "DEV NOTIF: DriverPickedUpStudentError: " +
          (message as ErrorResponse).error,
        color: "#FFD580",
        trigger: Date.now(),
      });
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
      setStartLocation(userLocationRef.current);

      // set the component to show to WaitingForRide version of handleRide
      setWhichComponent("handleRide");
      rideStatusRef.current = "WaitingForRide";
      setRideStatus("WaitingForRide");

      // show notification
      setNotifState({
        text: "Ride successfully requested",
        color: "#C9FED0",
        boldText: "requested",
        trigger: Date.now(),
      });
    } else {
      const errorMessage = message as ErrorResponse;
      console.log("Request ride error: ", message);
      setNotifState({
        text: errorMessage.error,
        color: "#FFCBCB",
        trigger: Date.now(),
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
      rideStatusRef.current = "DriverEnRoute";
      setRideStatus("DriverEnRoute");
    } else {
      console.log("Accept ride error: ", message);
      setNotifState({
        text: "DEV NOTIF: AcceptRideError: " + (message as ErrorResponse).error,
        color: "#FFD580",
        trigger: Date.now(),
      });
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
      setNotifState({
        text: "DEV NOTIF: WaitTimeError: " + (message as ErrorResponse).error,
        color: "#FFD580",
        trigger: Date.now(),
      });
    }
  };

  // WEBSOCKET -- DISTANCE
  const handleDistance = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "DISTANCE") {
      const distanceResp = message as DistanceResponse;
      if (distanceResp.tag === "walkToPickup") {
        const walkSeconds =
          distanceResp.apiResponse.rows[0].elements[0].duration.value;
        const walkMin = Math.floor(walkSeconds / 60);
        if (walkMin > 20) {
          // send a notification
          setNotifState({
            text: "You are too far away from the pickup location",
            color: "#FFCBCB",
            trigger: Date.now(),
          });
          // exit
          setShowRequestLoading(false);
          return;
        }
        // everything is good, set state and go to the confirm ride page
        setShowRequestLoading(false);
        setWalkDuration(walkMin); // convert seconds to minutes
        setWalkAddress(distanceResp.apiResponse.origin_addresses[0]);
      }
    } else {
      console.log("Distance response error: ", message);
      setNotifState({
        text: "DEV NOTIF: DistanceError: " + (message as ErrorResponse).error,
        color: "#FFD580",
        trigger: Date.now(),
      });
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
          status={rideStatusRef.current}
          startLocation={startLocation}
          whichComponent={"rideReq"}
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
        <View style={[styles.modalContainer, { bottom: 0 }]}>
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
              trigger={notifState.trigger}
            />
          )}
        </View>

        {/* Side Bar */}
        <View
          style={{
            position: "absolute",
            // set the height of the sidebar to the height of the current component + padding
            bottom: currentComponentHeight + 10,
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
          <Legend role={"STUDENT"}></Legend>
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
                userLocation={userLocationRef.current}
                rideRequested={rideRequested}
                startingState={startingState}
                setFAQVisible={setFAQVisible}
                recentLocations={recentLocations}
                setNotificationState={setNotifState}
                updateSideBarHeight={setCurrentComponentHeight}
                darkenScreen={setDarkenScreen}
                showRequestLoading={showRequestLoading}
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
                updateSideBarHeight={setCurrentComponentHeight}
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
                status={rideStatusRef.current}
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
                goHome={goHome}
                updateSideBarHeight={setCurrentComponentHeight}
              />
            </View>
          ) : null // default
        }
        {/* Overlay an semi-transparent screen when FAQ or profile or ride request confirmation mdoal is visible */}
        {(FAQVisible || profileVisible || darkenScreen) && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)", // semi-transparent background
              zIndex: 9999,
            }}
          />
        )}
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
