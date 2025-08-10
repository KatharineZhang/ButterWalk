import { useState, useEffect, useRef } from "react";
import {
  ErrorResponse,
  RideRequest,
  RidesExistResponse,
  ViewRideRequestResponse,
  WebSocketResponse,
} from "../../../server/src/api";
import {
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Text,
} from "react-native";
import Map, { MapRef, calculateDistance } from "./map";
import { useLocalSearchParams } from "expo-router";
import RequestAvailable from "@/components/Driver_RequestAvailable";
import Legend from "@/components/Student_Legend";
import Profile from "./profile";
import { Ionicons } from "@expo/vector-icons";
import Notification, { NotificationType } from "@/components/Both_Notification";
import TimeService from "@/services/TimeService";
import { styles } from "@/assets/styles";
import ShiftIsOver from "@/components/Driver_ShiftOver";
import NoRequests from "@/components/Driver_NoRequests";
import HandleRide from "@/components/Driver_HandleRide";
import Flagging from "@/components/Driver_Flagging";
import WebSocketService, {
  WebsocketConnectMessage,
} from "@/services/WebSocketService";
import { useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function HomePage() {
  /* HOME PAGE STATE */
  const [whichComponent, setWhichComponent] = useState<
    "noRequests" | "requestsAreAvailable" | "handleRide" | "endShift"
  >("noRequests");

  /* USE EFFECTS */
  useEffect(() => {
    WebSocketService.addListener(cancelRideListener, "CANCEL");
    WebSocketService.addListener(completeRideListener, "COMPLETE");
    WebSocketService.addListener(ridesExistListener, "RIDES_EXIST");
    WebSocketService.addListener(viewRideListener, "VIEW_RIDE");
    WebSocketService.addListener(viewDecisionListener, "VIEW_DECISION");
    WebSocketService.addListener(reportStudentListener, "REPORT");
    WebSocketService.addListener(
      driverDrivingToDropOffListener,
      "DRIVER_DRIVING_TO_DROPOFF"
    );
    WebSocketService.addListener(
      driverArrivedAtPickupListener,
      "DRIVER_ARRIVED_AT_PICKUP"
    );

    // Connect to the websocket server
    // needs to be its own function to avoid async issues
    const connectWebSocket = async () => {
      // call our new route
      const msg: WebsocketConnectMessage = await WebSocketService.connect();
      if (msg === "Failed to Connect") {
        console.error("Failed to connect to WebSocket");
      } else {
        console.log("WebSocket connected successfully");
        // wait till we hit this case to do any subsequent action
        afterConnectionSucceeds();
      }
    };
    connectWebSocket();
  }, []);

  // Any action we need to do after the client side connects to the websocket
  const afterConnectionSucceeds = () => {
    // send the CONNECT message with the netid
    // to log our driver into the server
    WebSocketService.send({
      directive: "CONNECT",
      netid: netid as string,
      role: "DRIVER",
    });
    seeIfRidesExist();
  };

  // set the initial component based on the current time
  useEffect(() => {
    // check if the user should be logged out based on the current time
    const interval = setInterval(() => {
      // check current time and compare with the shift hours
      if (TimeService.inServicableTime()) {
        // in shift
        setWhichComponent("noRequests");
        seeIfRidesExist();
      } else {
        // off shift
        setWhichComponent("endShift");
      }
    }, 1000 * 1800); // check every half hour
    return () => {
      // clear the interval when the component unmounts
      clearInterval(interval);
    };
  }, []);

  /* MAP STATE */
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  // the pick up location specified in teh ride request response
  const [pickUpLocation, setPickUpLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  // the drop off location specified in teh ride request response
  const [dropOffLocation, setDropOffLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  // retain a reference to the map to call functions on it later
  const mapRef = useRef<MapRef>(null);

  /* PROFILE STATE */
  const { netid } = useLocalSearchParams<{ netid: string }>();
  const [profileVisible, setProfileVisible] = useState(false);
  const router = useRouter();

  const onLogout = () => {
    // when the user clicks the logout button in the profile or logoutWarning
    // reset all fields to their initial state
    resetAllFields();
    // call the websocket call to disconnect the user
    WebSocketService.send({ directive: "DISCONNECT" });
    // redirect the user to the driverOrStudent page
    router.replace("/driverOrstudent"); // navigate programmatically
  };

  /* NOTIFICATION STATE */
  // what notification to show
  const [notifState, setNotifState] = useState<NotificationType>({
    text: "",
    color: "",
    boldText: "",
  });

  /* SIDE BAR STATE */
  const { height } = useWindowDimensions();
  // to start, the current component is the ride request form which takes up 40% of the screen height
  const [currentComponentHeight, setCurrentComponentHeight] = useState(
    Math.round(height * 0.5)
  );
  // when the user clicks the recenter button
  // recenter the map to the user's location
  const recenter = () => {
    if (mapRef.current) {
      mapRef.current.recenterMap();
    }
  };

  /* WAITING FOR REQUEST STATE */
  const seeIfRidesExist = () => {
    console.log("seeing if rides exist");
    // call the websocket call to see if rides exist
    WebSocketService.send({
      directive: "RIDES_EXIST",
    });
  };

  /* INCOMING RIDE REQUEST STATE */
  const [driverToPickupDuration, setDriverToPickupDuration] =
    useState<number>(0);
  const [pickupToDropoffDuration, setPickupToDropoffDuration] =
    useState<number>(0);
  const [requestInfo, setRequestInfo] = useState<RideRequest>(
    {} as RideRequest
  );
  const [showAcceptScreen, setShowAcceptScreen] = useState(true);

  const onAccept = () => {
    // when the driver clicks "Accept"
    // call "VIEW_RIDE" websocket call to get the ride request info
    // use driverLocation in the request
    WebSocketService.send({
      directive: "VIEW_RIDE",
      driverid: netid,
      driverLocation: driverLocation,
    });
  };

  // Handler for the "Let's Go" action in RequestAvailable
  const onLetsGo = () => {
    // when the driver clicks "Let's Go"
    // call the websocket call "VIEW_DECISION" with "ACCEPT" tag
    WebSocketService.send({
      directive: "VIEW_DECISION",
      driverid: netid,
      netid: requestInfo.netid,
      decision: "ACCEPT",
    });
  };

  /* EN ROUTE STATE */
  type HandleRidePhase =
    | "headingToPickup"
    | "waitingForPickup"
    | "headingToDropoff"
    | "arrivedAtDropoff";

  const [phase, setPhase] = useState<HandleRidePhase>("headingToPickup");

  // determines if the flagging functionality is do-able by the driver
  // True only for when handleRide’s STATE is “waiting for pick up”,
  // “heading to drop off location”, or “arrived”
  // All other PAGES and states should have this as FALSE
  const [flaggingAllowed, setFlaggingAllowed] = useState(false);
  // if the student is late, we want to allow flagging and show a message
  const [studentIsLate, setStudentIsLate] = useState(false);
  // this is used to control the visibility of the flagging popup
  const [flagPopupVisible, setFlagPopupVisible] = useState(false);

  /* STATES FOR PROGRESS TRACKING */
  // A number between 0 and 1 that represents the progress of the driver
  // from their starting location to the pickup location
  const [pickupProgress, setPickupProgress] = useState(0);

  // A number between 0 and 1 that represents the progress of the driver
  // from the pickup location to the dropoff location
  const [dropoffProgress, setDropoffProgress] = useState(0);

  // The driver's location when they started the ride
  const [startLocation, setStartLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  // Track if driver is close to pickup location
  const [isNearPickup, setIsNearPickup] = useState(false);

  // Track if driver is close to dropoff location
  const [isNearDropoff, setIsNearDropoff] = useState(false);

  const flagStudent = (reason: string) => {
    if (!requestInfo.requestId) {
      return; // TODO: handle error case where requestId is not set
    }
    // call the REPORT route
    WebSocketService.send({
      directive: "REPORT",
      netid: requestInfo.netid, // the student netid
      requestid: requestInfo.requestId, // the ride request id
      reason,
    });
  };

  const cancelRide = () => {
    // call the websocket call to cancel the ride
    WebSocketService.send({
      directive: "CANCEL",
      netid,
      role: "DRIVER",
    });
  };

  const completeRide = () => {
    WebSocketService.send({
      directive: "COMPLETE",
      requestid: requestInfo.requestId as string,
    });
  };

  const driverArrivedAtPickup = () => {
    WebSocketService.send({
      directive: "DRIVER_ARRIVED_AT_PICKUP",
      driverid: netid,
      studentNetid: requestInfo.netid,
    });
  };

  const driverDrivingToDropOff = () => {
    WebSocketService.send({
      directive: "DRIVER_DRIVING_TO_DROPOFF",
      driverid: netid,
      studentNetid: requestInfo.netid,
    });
  };

  const resetAllFields = () => {
    // reset all fields to their initial state
    setDriverLocation({ latitude: 0, longitude: 0 });
    setPickUpLocation({ latitude: 0, longitude: 0 });
    setDropOffLocation({ latitude: 0, longitude: 0 });
    setDriverToPickupDuration(0);
    setPickupToDropoffDuration(0);
    setRequestInfo({} as RideRequest);
    setFlaggingAllowed(false);
    setFlagPopupVisible(false);
    setNotifState({
      text: "",
      color: "",
      boldText: "",
    });
    setWhichComponent("noRequests");
    // Reset progress tracking states
    setPickupProgress(0);
    setDropoffProgress(0);
    setStartLocation({ latitude: 0, longitude: 0 });
    setIsNearPickup(false);
    setIsNearDropoff(false);
  };

  /* END SHIFT STATE */

  /* WEBSOCKET Listeners */
  // WEBSOCKET - CANCEL
  const cancelRideListener = (message: WebSocketResponse) => {
    // recived a message that ride is canceled
    if ("response" in message && message.response === "CANCEL") {
      // if successful, set the current component to "noRequests"
      resetAllFields();
      setWhichComponent("noRequests");
      setNotifState({
        text: "Your ride was canceled",
        color: "#FFCBCB",
        boldText: "canceled",
      });
    } else {
      // if not successful, log the error
      const errMessage = message as ErrorResponse;
      console.log("Failed to cancel ride: ", errMessage.error);
    }
  };

  // WEBSOCKET - COMPLETE
  const completeRideListener = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "COMPLETE") {
      // reset all fields
      resetAllFields();
      setWhichComponent("noRequests");
    } else {
      // if not successful, log the error
      const errMessage = message as ErrorResponse;
      console.log("Failed to complete ride: ", errMessage.error);
    }
  };

  // WEBSOCKET - RIDES_EXIST
  const ridesExistListener = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "RIDES_EXIST") {
      const ridesExistMessage = message as RidesExistResponse;
      if (
        whichComponent === "noRequests" ||
        whichComponent === "requestsAreAvailable"
      ) {
        // if the driver is waiting for a request
        if (ridesExistMessage.ridesExist) {
          // and rides exist, set the component to "requestsAreAvailable"
          setWhichComponent("requestsAreAvailable");
          setNotifState({
            text: "New ride request available",
            color: "#C9FED0",
            boldText: "New ride",
          });
        } else {
          // if false, set the component to "noRequests"
          setWhichComponent("noRequests");
        }
      } else {
        // if the driver is not waiting for a request, do nothing
        console.log("rides don't exist anymore but we don't care");
      }
    } else {
      // there was an error in the message!
      const errMessage = message as ErrorResponse;
      console.log("Failed to see if rides exist: ", errMessage.error);
    }
  };

  // WEBSOCKET - VIEW_RIDE
  const viewRideListener = (message: WebSocketResponse) => {
    if ("response" in message && message.response == "VIEW_RIDE") {
      const viewReqResponse = message as ViewRideRequestResponse;
      console.log("Successfully viewed ride request: ", viewReqResponse);
      console.log("is ride request info: ", viewReqResponse.rideInfo);

      if (viewReqResponse.rideInfo) {
        // if the ride request info exists, then the view was successful
        // set the requestInfo state to the ride request info
        setRequestInfo(viewReqResponse.rideInfo.rideRequest);

        // set the pick up and drop off locations coordinates
        // (the names can be extracted from the requestInfo if needed)
        setPickUpLocation(
          viewReqResponse.rideInfo.rideRequest.locationFrom.coordinates
        );
        setDropOffLocation(
          viewReqResponse.rideInfo.rideRequest.locationTo.coordinates
        );

        // set the durations
        setDriverToPickupDuration(
          viewReqResponse.rideInfo.driverToPickUpDuration
        );
        setPickupToDropoffDuration(
          viewReqResponse.rideInfo.pickUpToDropOffDuration
        );
        // Switch to the Let's Go page here not in Driver_RequestAvailable
        setShowAcceptScreen(false);
      } else {
        // if the ride request info does not exist, then the view was not successful
        // if not successful, show a notification and set currentComponent to "noRequests"
        setNotifState({
          text: "The ride you were trying to view does not exist anymore.",
          color: "#FFCBCB",
        });
        resetAllFields(); // reset all fields
        setWhichComponent("noRequests"); // go to no requests page
      }
    } else {
      const errMessage = message as ErrorResponse;
      console.log("Failed to view ride request: ", errMessage.error);
    }
  };

  // WEBSOCKET - VIEW_DECISION
  const viewDecisionListener = (message: WebSocketResponse) => {
    // the logic for when a decision is made on a ride request
    if ("response" in message && message.response === "VIEW_DECISION") {
      // if the decision was successful, set the current component to "handleRide"
      setNotifState({
        text: "Ride accepted successfully",
        color: "#C9FED0",
        boldText: "accepted",
      });
      setWhichComponent("handleRide");
    } else {
      const errMessage = message as ErrorResponse;
      console.log("Failed to accept ride request: ", errMessage.error);

      // if the decision was not successful,
      // show a notification and set currentComponent to "noRequests"
      setNotifState({
        text: "Failed to accept ride request",
        color: "#FFCBCB",
      });
      resetAllFields(); // reset all fields
      setWhichComponent("noRequests"); // go to no requests page
    }
  };

  // WEBSOCKET - DRIVER ARRIVED (at the pickup location)
  const driverArrivedAtPickupListener = (message: WebSocketResponse) => {
    // logic for when the driver arrives at the pick up location
    if (
      "response" in message &&
      message.response === "DRIVER_ARRIVED_AT_PICKUP"
    ) {
      console.log("Driver arrived at pickup location");
      setPhase("waitingForPickup");
    } else {
      const errMessage = message as ErrorResponse;
      console.log(
        "Failed to note that driver arrived at pickup: ",
        errMessage.error
      );
      // if not successful, show a notification that the driver could not arrive at the pickup location
      setNotifState({
        text: "Failed to note that driver arrived at pickup location",
        color: "#FFCBCB",
      });
      setFlagPopupVisible(false); // close the flagging popup
    }
  };

  // WEBSOCKET - REPORT
  const reportStudentListener = (message: WebSocketResponse) => {
    //  logic for when a student is flagged
    if ("response" in message && message.response === "REPORT") {
      if ("success" in message && message.success === true) {
        // if successful, show a notification that the student has been flagged
        setFlagPopupVisible(false); // close the flagging popup
        setNotifState({
          text: "Student has been flagged",
          color: "#C9FED0",
          boldText: "flagged",
        });
      } else {
        // if not successful, show a notification that the student could not be flagged
        setNotifState({
          text: "Failed to flag student",
          color: "#FFCBCB",
        });
        setFlagPopupVisible(false); // close the flagging popup
      }
    } else {
      const errMessage = message as ErrorResponse;
      console.log("Failed to flag student: ", errMessage.error);
    }
  };

  // WEBSOCKET - DRIVER_DRIVING_TO_DROPOFF
  const driverDrivingToDropOffListener = (message: WebSocketResponse) => {
    //  logic for when a student is flagged
    if (
      "response" in message &&
      message.response === "DRIVER_DRIVING_TO_DROPOFF"
    ) {
      setPhase("headingToDropoff");
    } else {
      const errMessage = message as ErrorResponse;
      console.log(
        "Failed to note that driver is driving to dropoff: ",
        errMessage.error
      );
    }
  };

  /* PROGRESS TRACKING EFFECTS */
  // Track progress when driver location changes and is handling a ride
  useEffect(() => {
    if (whichComponent === "handleRide") {
      let pickupProgress = 0;
      let dropoffProgress = 0;

      // If phase is waitingForPickup, force pickupProgress to 1
      if (phase === "waitingForPickup") {
        pickupProgress = 1;

        // if phase is headingtopickup or geadingtodropoff
      } else if (
        startLocation.latitude !== 0 &&
        startLocation.longitude !== 0 &&
        pickUpLocation.latitude !== 0 &&
        pickUpLocation.longitude !== 0
      ) {
        pickupProgress = calculateProgress(
          startLocation,
          driverLocation,
          pickUpLocation
        );
      }

      if (
        pickUpLocation.latitude !== 0 &&
        pickUpLocation.longitude !== 0 &&
        dropOffLocation.latitude !== 0 &&
        dropOffLocation.longitude !== 0
      ) {
        dropoffProgress = calculateProgress(
          pickUpLocation,
          driverLocation,
          dropOffLocation
        );
      }

      setPickupProgress(pickupProgress);
      setDropoffProgress(dropoffProgress);
    }
  }, [driverLocation, phase, whichComponent, requestInfo.requestId]);

  // Set start location when ride is accepted
  useEffect(() => {
    if (whichComponent === "handleRide" && requestInfo.requestId) {
      if (startLocation.latitude === 0 && startLocation.longitude === 0) {
        setStartLocation(driverLocation);
      }
    }
  }, [whichComponent, requestInfo.requestId]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* map component */}
      <Map
        ref={mapRef}
        pickUpLocation={pickUpLocation}
        dropOffLocation={dropOffLocation}
        userLocationChanged={(location) => setDriverLocation(location)}
      />

      {/* profile button in top left corner*/}
      <View
        style={{
          zIndex: 100,
          position: "absolute",
          paddingVertical: 20,
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
          style={{ width: 35, height: 35, top: "3%" }}
          onPress={() => setProfileVisible(true)}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 100,
              width: 35,
              height: 35,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="menu" size={30} color="#4B2E83" />
          </View>
        </TouchableOpacity>
      </View>
      {/* the profile component */}
      <View style={styles.modalContainer}>
        <Profile
          isVisible={profileVisible}
          onClose={() => setProfileVisible(false)}
          onLogOut={onLogout}
          netid={netid}
        />
      </View>

      {/* Flag button in top right corner*/}
      {flaggingAllowed && (
        <TouchableOpacity
          style={{
            position: "absolute",
            // the button needs to be a little lower if part of the student is late message
            top: studentIsLate ? "7%" : "5%",
            right: "3%",
            zIndex: 200,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.5,
            shadowRadius: 5,
            shadowColor: "grey",
          }}
          onPress={() => setFlagPopupVisible(true)}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 100,
              width: 70,
              height: 70,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 100,
              position: "absolute",
              right: 10,
            }}
          >
            <Ionicons name="flag" size={40} color="red" />
          </View>
        </TouchableOpacity>
      )}

      {/* Flagging Message if student is late*/}
      {studentIsLate && (
        <View
          style={{
            alignItems: "flex-start",
            position: "absolute",
            zIndex: 150,
            backgroundColor: "#4B2E83",
            marginHorizontal: "2.5%",
            top: "5%",
            height: "12%",
            width: "95%",
            padding: 20,
            justifyContent: "center",
            shadowOpacity: 0.3,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "white", fontSize: 15, fontWeight: "bold" }}>
            Flag this student for being late?
          </Text>
        </View>
      )}

      {/* Flagging Pop-up */}
      {flagPopupVisible && (
        <Flagging
          onFlag={flagStudent}
          closePopUp={() => setFlagPopupVisible(false)}
        />
      )}

      {/* Notification */}
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
        <Legend />
      </View>

      {/* Decide which component to render */}
      {whichComponent === "noRequests" ? (
        <View style={styles.homePageComponentContainer}>
          <NoRequests
            updateSideBarHeight={setCurrentComponentHeight}
            seeIfRidesExist={seeIfRidesExist}
          />
        </View>
      ) : whichComponent === "requestsAreAvailable" ? (
        <View style={styles.homePageComponentContainer}>
          <RequestAvailable
            requestInfo={requestInfo}
            showAcceptScreen={showAcceptScreen}
            updateSideBarHeight={setCurrentComponentHeight}
            driverToPickupDuration={driverToPickupDuration}
            pickupToDropoffDuration={pickupToDropoffDuration}
            onAccept={onAccept}
            onLetsGo={onLetsGo}
          />
        </View>
      ) : whichComponent === "handleRide" ? (
        <View style={styles.homePageComponentContainer}>
          <HandleRide
            phase={phase}
            setPhase={setPhase}
            requestInfo={requestInfo}
            driverToPickupDuration={driverToPickupDuration}
            pickupToDropoffDuration={pickupToDropoffDuration}
            changeFlaggingAllowed={setFlaggingAllowed}
            completeRide={completeRide}
            changeNotifState={setNotifState}
            onCancel={cancelRide}
            driverArrivedAtPickup={driverArrivedAtPickup}
            driverDrivingToDropOff={driverDrivingToDropOff}
            setStudentIsLate={setStudentIsLate}
            pickupProgress={pickupProgress}
            dropoffProgress={dropoffProgress}
            isNearPickup={isNearPickup}
            isNearDropoff={isNearDropoff}
            updateSideBarHeight={setCurrentComponentHeight}
          />
        </View>
      ) : whichComponent === "endShift" ? (
        <View style={styles.homePageComponentContainer}>
          <ShiftIsOver
            updateSideBarHeight={setCurrentComponentHeight}
            changeNotifState={setNotifState}
          />
        </View>
      ) : null}
    </GestureHandlerRootView>
  );
}

/**
 * Helper function to calculate the progress of the driver from start to destination
 * @param start - starting coordinates
 * @param current - current coordinates
 * @param dest - destination coordinates
 * @returns progress as a number between 0 and 1
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
  // use this to calc progress because the driver may not be
  // driving in a straight line from the start location
  const remaining = calculateDistance(current, dest);
  const currentDistance = distance - remaining;
  return currentDistance / distance; // remaining distance
};
