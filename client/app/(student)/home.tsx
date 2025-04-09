import { useState, useEffect, useRef } from "react";
import { TouchableOpacity, View } from "react-native";
import Profile from "./profile";
import Map, { calculateDistance, isSameLocation } from "./map";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import {
  DistanceResponse,
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
import { createOpenLink } from "react-native-open-maps";
import LoadingPageComp from "@/components/loadingPageComp";
import Notification from "@/components/notification";

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
  // walking to the pickup location will be -1 if the user clicked
  // "Current Location" on the ride request form
  // and therefore will not need to walk
  const [walkProgress, setWalkProgress] = useState(-1);
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
  }

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
      });

    } else if (whichComponent == "handleRide") {
      // if we are handling the ride, check if walking is needed by setting start location
      setStartLocation(userLocation);
      // if the start location is not the pickup location
      // the user must walk
      if (!isSameLocation(userLocation, pickUpLocation)) {
        // set initial walk progress
        setWalkProgress(0);
      }
    }
  }, [whichComponent]);

  // if the component shown is handleRide,
  // everytime a location changes, check the wait time and walking/ride progress
  // to update the progress bar
  useEffect(() => {
    if (whichComponent == "handleRide") {
      // update the walking progress if the pickup Location was not the user's starting location
      if (
        startLocation.latitude != 0 &&
        !isSameLocation(userLocation, pickUpLocation)
      ) {
        console.log("updating walk progress");
        // there is a large enough distance that the user needs to walk
        const wp = calculateProgress(
          startLocation,
          userLocation,
          pickUpLocation
        );
        console.log("walk progress:", wp);
        setWalkProgress(wp);
      }

      // a driver has not accepted, but if we are on the handleRide component
      // we know a ride has been requested
      // use the request id to check the status of the ride in the queue
      if (driverLocation.latitude == 0 && driverLocation.longitude == 0) {
        // if the last time we checked the driverETA (which represented our place in the queue * 15),
        // it was not 0, we are not first in queue.
        if (driverETA !== 0) {
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
        console.log("distance", calculateDistance(driverLocation, pickUpLocation));
        // the driver has accepted our ride
         if (isSameLocation(driverLocation, pickUpLocation) && rideStatus == "DriverEnRoute") {
          // check if the driver has arrived
          setRideStatus("DriverArrived");
        } else {
          // else check their progress in reaching the student
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

      // check if the driver has arrived at the pickup location
      // (aka the driver is a negligible distance from the pickup location)
      console.log("distance", calculateDistance(driverResp, pickUpLocation));
      if (
        isSameLocation(driverResp, pickUpLocation) &&
        rideStatus == "DriverEnRoute"
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
          isSameLocation(driverResp, dropOffLocation)
        ) {
          setRideStatus("RideCompleted");
        }
      }
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

      // set the notif state based on the reason
      if (cancelReason.current === "button") {
        setNotifState({
          text: "Ride successfully canceled",
          color: "#FFCBCB",
          boldText: "canceled",
        });
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
    setPickUpLocationName("" as ValidLocationType);
    setDropOffLocationName("" as ValidLocationType);
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

    // set walk progress back to -1
    setWalkProgress(-1);
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

      // TODO: REDUNDANT? IDK WHY IT WASN'T UPDATING START LOCATION FROM HERE
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
  // TODO: WE CANNOT ASSUME ALL DISTANCE RESPONSES
  // ARE FOR WALKING DURATION EVENTUALLY...(FAKE DIJKSTRAS)
  const handleDistance = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "DISTANCE") {
      const distanceResp = message as DistanceResponse;
      const walkSeconds =
        distanceResp.apiResponse.rows[0].elements[0].duration.value;
      setWalkDuration(Math.floor(walkSeconds / 60)); // convert seconds to minutes
      setWalkAddress(distanceResp.apiResponse.origin_addresses[0]);
    } else {
      console.log("Distance response error: ", message);
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
        status={rideStatus}
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
      <FAQ isVisible={FAQVisible} onClose={() => setFAQVisible(false)} />

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
  console.log(
    "current distance:",
    currentDistance,
    "total distance:",
    distance,
    "fraction:",
    currentDistance / distance
  );
  return currentDistance / distance; // remaining distance
};
