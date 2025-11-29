import { useState, useEffect, useRef } from "react";
import {
  CallLogResponse,
  ErrorResponse,
  LoadRideResponse,
  LocationResponse,
  RideRequest,
  RidesExistResponse,
  ViewRideRequestResponse,
  WaitTimeResponse,
  WebSocketResponse,
} from "../../../server/src/api";
import {
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Text,
  Linking,
} from "react-native";
import Map, { MapRef, isSameLocation } from "./map";
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
  WSConnectionState,
} from "@/services/WebSocketService";
import { useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DisconnectedModal from "@/components/Both_Disconnected";
import { Coordinates } from "@/services/BuildingService";
import Message from "./message";

export type HandleRidePhase =
  | "headingToPickup"
  | "waitingForPickup"
  | "headingToDropoff"
  | "arrivedAtDropoff";

export default function HomePage() {
  /* HOME PAGE STATE */
  const [, setWhichComponent] = useState<
    "noRequests" | "requestsAreAvailable" | "handleRide" | "endShift"
  >(TimeService.inServicableTime() ? "noRequests" : "endShift");
  const whichComponent = useRef<
    "noRequests" | "requestsAreAvailable" | "handleRide" | "endShift"
  >("endShift");
  // only visibile when driver accepts ride request
  const [messageVisible, setMessageVisible] = useState(false);

  /* USE EFFECTS */
  useEffect(() => {
    WebSocketService.addListener(cancelRideListener, "CANCEL");
    WebSocketService.addListener(completeRideListener, "COMPLETE");
    WebSocketService.addListener(ridesExistListener, "RIDES_EXIST");
    WebSocketService.addListener(viewRideListener, "VIEW_RIDE");
    WebSocketService.addListener(viewDecisionListener, "VIEW_DECISION");
    WebSocketService.addListener(reportStudentListener, "REPORT");
    WebSocketService.addListener(locationListener, "LOCATION");
    WebSocketService.addListener(handleLoadRideResponse, "LOAD_RIDE");
    WebSocketService.addListener(waitTimeListener, "WAIT_TIME");
    WebSocketService.addListener(callLogListener, "CALL_LOG");
    WebSocketService.addListener(
      driverDrivingToDropOffListener,
      "DRIVER_DRIVING_TO_DROPOFF"
    );
    WebSocketService.addListener(
      driverArrivedAtPickupListener,
      "DRIVER_ARRIVED_AT_PICKUP"
    );
    // handle disconnects by listening for changes in websocket state
    WebSocketService.addConnectionListener(handleWebsocketConnection);

    // Connect to the websocket server
    // needs to be its own function to avoid async issues
    const connectWebSocket = async () => {
      // call our new route
      const msg: WebsocketConnectMessage = await WebSocketService.connect()
        .then((msg) => msg)
        .catch((err) => err);
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
    checkIfTime();
  };

  // set the initial component based on the current time
  const checkIfTime = () => {
    console.log("checking shift time");
    if (TimeService.inServicableTime()) {
      // in shift
      setWhichComponent("noRequests");
      whichComponent.current = "noRequests";
      seeIfRidesExist();
      // see if there is an active ride request
      sendLoadRide();
    } else {
      // off shift
      setWhichComponent("endShift");
    }
  };

  // check if the user should be logged out based on the current time
  useEffect(() => {
    const interval = setInterval(() => {
      // check current time and compare with the shift hours
      if (interval != 0) {
        checkIfTime();
      }
    }, 1000 * 1800); // check every half hour
    return () => {
      // clear the interval when the component unmounts aka you leave home.tsx
      clearInterval(interval);
    };
  }, []);

  // Set start location when ride is accepted
  useEffect(() => {
    if (whichComponent.current == "handleRide") {
      setStartLocation(driverLocationRef.current);
    }
  }, [whichComponent.current]);

  /* MAP STATE */
  const [, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });
  const driverLocationRef = useRef<{
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

  // The driver's location when they started the ride
  const [startLocation, setStartLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  // The student's location
  const studentLocation = useRef<Coordinates>({ latitude: 0, longitude: 0 });
  const [, setStudentLocation] = useState<Coordinates>({
    latitude: 0,
    longitude: 0,
  });

  // retain a reference to the map to call functions on it later
  const mapRef = useRef<MapRef>(null);

  // function to be called when the user's location changes
  const userLocationChanged = (location: {
    latitude: number;
    longitude: number;
  }) => {
    setDriverLocation(location);
    driverLocationRef.current = location;
    // send the location to the student once the ride is accepted
    if (whichComponent.current === "handleRide" && requestInfo.current.netid) {
      WebSocketService.send({
        directive: "LOCATION",
        id: netid,
        role: "DRIVER",
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  };

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
    trigger: 0,
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
  const [studentPhoneNumber, setStudentPhoneNumber] = useState<string>("");
  const [, setRequestInfo] = useState<RideRequest>({} as RideRequest);
  const requestInfo = useRef<RideRequest>({} as RideRequest);

  const [showAcceptScreen, setShowAcceptScreen] = useState(true);

  const onAccept = () => {
    // when the driver clicks "Accept"
    // call "VIEW_RIDE" websocket call to get the ride request info
    // use driverLocation in the request
    WebSocketService.send({
      directive: "VIEW_RIDE",
      driverid: netid,
      driverLocation: driverLocationRef.current,
    });
  };

  type HandleRidePhase =
  | "headingToPickup"
  | "waitingForPickup"
  | "headingToDropoff"
  | "arrivedAtDropoff";

  // Handler for the "Let's Go" action in RequestAvailable
  const onLetsGo = () => {
    // when the driver clicks "Let's Go"
    // call the websocket call "VIEW_DECISION" with "ACCEPT" tag
    WebSocketService.send({
      directive: "VIEW_DECISION",
      driverid: netid,
      netid: requestInfo.current.netid,
      decision: "ACCEPT",
    });
  };

  const makeCall = (phoneNumber: string) => {
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      console.error("Invalid phone number: ", phoneNumber);
      return;
    }

    WebSocketService.send({
      directive: "CALL_LOG",
      from: netid,
      to: requestInfo.current.netid,
      role: "DRIVER",
      phoneNumberCalled: phoneNumber,
    });

    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch((err) =>
      console.error("Error making call: ", err)
    );
  };

  /* EN ROUTE STATE */
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

  // Total distances for progress calculation
  const [totalPickupDistance, setTotalPickupDistance] = useState(0);
  const [totalDropoffDistance, setTotalDropoffDistance] = useState(0);

  // Track if driver is close to pickup location
  const [isNearPickup, setIsNearPickup] = useState(false);

  // Track if driver is close to dropoff location
  const [isNearDropoff, setIsNearDropoff] = useState(false);

  const flagStudent = (reason: string) => {
    if (!requestInfo.current.requestId) {
      return; // TODO: handle error case where requestId is not set
    }
    // call the REPORT route
    WebSocketService.send({
      directive: "REPORT",
      netid: requestInfo.current.netid, // the student netid
      requestid: requestInfo.current.requestId, // the ride request id
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
      requestid: requestInfo.current.requestId as string,
    });
  };

  const driverArrivedAtPickup = () => {
    WebSocketService.send({
      directive: "DRIVER_ARRIVED_AT_PICKUP",
      driverid: netid,
      studentNetid: requestInfo.current.netid,
    });
  };

  const driverDrivingToDropOff = () => {
    WebSocketService.send({
      directive: "DRIVER_DRIVING_TO_DROPOFF",
      driverid: netid,
      studentNetid: requestInfo.current.netid,
    });
  };

  const resetAllFields = () => {
    // reset all fields to their initial state
    setPickUpLocation({ latitude: 0, longitude: 0 });
    setDropOffLocation({ latitude: 0, longitude: 0 });
    setDriverToPickupDuration(0);
    setPickupToDropoffDuration(0);
    requestInfo.current = {} as RideRequest;
    setRequestInfo({} as RideRequest);
    setFlaggingAllowed(false);
    setFlagPopupVisible(false);
    setNotifState({
      text: "",
      color: "",
      boldText: "",
      trigger: 0,
    });
    whichComponent.current = "noRequests";
    // Reset progress tracking states
    setPickupProgress(0);
    setDropoffProgress(0);
    setTotalPickupDistance(0);
    setTotalDropoffDistance(0);
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
      whichComponent.current = "noRequests";
      setNotifState({
        text: "Your ride was canceled",
        color: "#FFCBCB",
        boldText: "canceled",
        trigger: Date.now(),
      });
      setStudentIsLate(false);
    } else {
      // if not successful, log the error
      const errMessage = message as ErrorResponse;
      console.log("Failed to cancel ride: ", errMessage.error);
      setNotifState({
        text: "DEV NOTIF: CancelRideError: " + errMessage.error,
        color: "#FFD580",
        trigger: Date.now(),
      });
    }
  };

  // WEBSOCKET - COMPLETE
  const completeRideListener = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "COMPLETE") {
      // reset all fields
      resetAllFields();
      setWhichComponent("noRequests");
      whichComponent.current = "noRequests";
    } else {
      // if not successful, log the error
      const errMessage = message as ErrorResponse;
      console.log("Failed to complete ride: ", errMessage.error);
      setNotifState({
        text: "DEV NOTIF: CompleteRideError: " + errMessage.error,
        color: "#FFD580",
        trigger: Date.now(),
      });
    }
  };

  // WEBSOCKET - RIDES_EXIST
  const ridesExistListener = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "RIDES_EXIST") {
      const ridesExistMessage = message as RidesExistResponse;
      if (
        whichComponent.current === "noRequests" // ||
        // whichComponent.current === "requestsAreAvailable"
      ) {
        // if the driver is waiting for a request
        if (ridesExistMessage.ridesExist) {
          // and rides exist, set the component to "requestsAreAvailable"
          setWhichComponent("requestsAreAvailable");
          whichComponent.current = "requestsAreAvailable";

          setNotifState({
            text: "New ride request available",
            color: "#C9FED0",
            boldText: "New ride",
            trigger: Date.now(),
          });
        } else {
          // if false, set the component to "noRequests"
          setWhichComponent("noRequests");
          whichComponent.current = "noRequests";
        }
      } else {
        // if the driver is not waiting for a request, do nothing
        console.log("We got a RIDES_EXIST message, but we don't care.");
        setNotifState({
          text:
            "DEV NOTIF: RidesExist: " +
            ridesExistMessage.ridesExist +
            " ignored",
          color: "#FFD580",
          trigger: Date.now(),
        });
      }
    } else {
      // there was an error in the message!
      const errMessage = message as ErrorResponse;
      console.log("Failed to see if rides exist: ", errMessage.error);
      setNotifState({
        text: "DEV NOTIF: RidesExistError: " + errMessage.error,
        color: "#FFD580",
        trigger: Date.now(),
      });
    }
  };

  // WEBSOCKET - VIEW_RIDE
  const viewRideListener = (message: WebSocketResponse) => {
    if ("response" in message && message.response == "VIEW_RIDE") {
      const viewReqResponse = message as ViewRideRequestResponse;

      if (viewReqResponse.rideInfo) {
        // if the ride request info exists, then the view was successful
        // set the requestInfo state to the ride request info
        requestInfo.current = viewReqResponse.rideInfo.rideRequest;
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
        setStudentPhoneNumber(viewReqResponse.rideInfo.studentPhoneNumber);

        // Switch to the Let's Go page here not in Driver_RequestAvailable
        setShowAcceptScreen(false);
      } else {
        // if the ride request info does not exist, then the view was not successful
        // if not successful, show a notification and set currentComponent to "noRequests"
        setNotifState({
          text: "The ride you were trying to view does not exist anymore.",
          color: "#FFCBCB",
          trigger: Date.now(),
        });
        resetAllFields(); // reset all fields
        setWhichComponent("noRequests"); // go to no requests page
        whichComponent.current = "noRequests";
      }
    } else {
      const errMessage = message as ErrorResponse;
      setNotifState({
        text: "Failed to view ride request: " + errMessage.error,
        color: "#FFCBCB",
        trigger: Date.now(),
      });
      setWhichComponent("noRequests"); // go to no requests page
      whichComponent.current = "noRequests";
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
        trigger: Date.now(),
      });
      setStartLocation(driverLocationRef.current);
      setWhichComponent("handleRide");
      whichComponent.current = "handleRide";
      WebSocketService.send({
        directive: "LOCATION",
        id: netid,
        role: "DRIVER",
        latitude: driverLocationRef.current.latitude,
        longitude: driverLocationRef.current.longitude,
      });
    } else {
      const errMessage = message as ErrorResponse;
      console.log("Failed to accept ride request: ", errMessage.error);

      // if the decision was not successful,
      // show a notification and set currentComponent to "noRequests"
      setNotifState({
        text: "Failed to accept ride request",
        color: "#FFCBCB",
        trigger: Date.now(),
      });
      resetAllFields(); // reset all fields
      setWhichComponent("noRequests"); // go to no requests page
      whichComponent.current = "noRequests";
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
        trigger: Date.now(),
      });
      setFlagPopupVisible(false); // close the flagging popup
    }
  };

  // WEBSOCKET - LOAD RIDE
  const sendLoadRide = () => {
    WebSocketService.send({
      directive: "LOAD_RIDE",
      id: netid,
      role: "DRIVER",
    });
  };
  const handleLoadRideResponse = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "LOAD_RIDE") {
      const loadRideMessage = message as LoadRideResponse;
      if (loadRideMessage.rideRequest) {
        const ride = loadRideMessage.rideRequest;
        setPickUpLocation(ride.locationFrom.coordinates);
        setDropOffLocation(ride.locationTo.coordinates);

        studentLocation.current = ride.studentLocation.coords;
        setStudentLocation(ride.studentLocation.coords);

        requestInfo.current = ride;
        setRequestInfo(ride);

        // decide which phase to set based on the ride status
        switch (ride.status as string) {
          case "VIEWING":
            // go to requestsAreAvailable page
            setWhichComponent("requestsAreAvailable");
            whichComponent.current = "requestsAreAvailable";

            // Switch to the Let's Go page here
            setShowAcceptScreen(false);
            break;
          case "DRIVING TO PICK UP":
            setWhichComponent("handleRide");
            whichComponent.current = "handleRide";

            setPhase("headingToPickup");
            break;
          case "DRIVER AT PICK UP":
            setWhichComponent("handleRide");
            setPhase("waitingForPickup");
            break;
          case "DRIVING TO DESTINATION":
            setWhichComponent("handleRide");
            setPhase("headingToDropoff");
            break;
          default:
            // if the ride is in any other status (completed), go to noRequests page
            setWhichComponent("noRequests");
            whichComponent.current = "noRequests";
            break;
        }
        // get any wait time info
        WebSocketService.send({
          directive: "WAIT_TIME",
          requestid: ride.requestId,
          requestedRide: {
            pickUpLocation: ride.locationFrom.coordinates,
            dropOffLocation: ride.locationTo.coordinates,
          },
          driverLocation: driverLocationRef.current,
        });
      }
      // if no ride request, do nothing and stay on current page
    } else {
      // something went wrong
      console.log("Load Ride response error: ", message);
    }
  };

  // WEBSOCKET- for checking the websocket state
  // store the websocket's status
  const [websocketStatus, setWebsocketStatus] =
    useState<WSConnectionState>("CONNECTED");
  // listener that will update websocket status when called
  const handleWebsocketConnection = (wsStatus: number | undefined) => {
    const status: WSConnectionState =
      wsStatus == WebSocket.OPEN
        ? "CONNECTED"
        : wsStatus == WebSocket.CONNECTING
          ? "CONNECTING"
          : "DISCONNECTED";
    console.log("DRIVER SEES WS " + status);
    setWebsocketStatus(status);
  };

  // WEBSOCKET - WAIT_TIME
  const waitTimeListener = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "WAIT_TIME") {
      const waitTimeresp = message as WaitTimeResponse;
      setDriverToPickupDuration(waitTimeresp.driverETA);
      setPickupToDropoffDuration(waitTimeresp.rideDuration);
    } else {
      const errMessage = message as ErrorResponse;
      console.log("Failed to get wait time: ", errMessage.error);
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
          trigger: Date.now(),
        });
        setStudentIsLate(false); // get rid of the student is late message
      } else {
        // if not successful, show a notification that the student could not be flagged
        setNotifState({
          text: "Failed to flag student",
          color: "#FFCBCB",
          trigger: Date.now(),
        });
        setFlagPopupVisible(false); // close the flagging popup
      }
    } else {
      const errMessage = message as ErrorResponse;
      console.log("Failed to flag student: ", errMessage.error);
      setNotifState({
        text: "DEV NOTIF: FlagStudentError: " + errMessage.error,
        color: "#FFD580",
        trigger: Date.now(),
      });
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
      setNotifState({
        text: "Failed to note that driver arrived at pickup location",
        color: "#FFCBCB",
        trigger: Date.now(),
      });
    }
  };

  // WEBSOCKET - LOCATION
  const locationListener = (message: WebSocketResponse) => {
    // logic for when a location update is received
    if ("response" in message && message.response === "LOCATION") {
      // store the student's location for when the driver is waiting for the pickup
      const locationMessage = message as LocationResponse;
      setStudentLocation({
        latitude: locationMessage.latitude,
        longitude: locationMessage.longitude,
      });
      studentLocation.current = {
        latitude: locationMessage.latitude,
        longitude: locationMessage.longitude,
      };
    } else {
      const errMessage = message as ErrorResponse;
      console.log("Failed to send location: ", errMessage.error);
      setNotifState({
        text: "DEV NOTIF: LocationError: " + errMessage.error,
        color: "#FFD580",
        trigger: Date.now(),
      });
    }
  };

  // WEBSOCKET - CALL_LOG
  const callLogListener = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "CALL_LOG") {
      const callLogResp = message as CallLogResponse;
      if (callLogResp.whoCalled === netid) {
        console.log("Call log recorded successfully");
      } else {
        alert(
          "Your passenger (netid: " +
            callLogResp.whoCalled +
            ") is calling you! Please answer so that this ride can be coordinated."
        );
      }
    } else {
      const errMessage = message as ErrorResponse;
      console.log("Failed to log call: ", errMessage.error);
    }
  };

  /* PROGRESS TRACKING EFFECTS */
  // Track progress when driver location changes and is handling a ride
  useEffect(() => {
    if (whichComponent.current === "handleRide") {
      let pickupProgress = 0;
      let dropoffProgress = 0;

      if (startLocation.latitude !== 0 && startLocation.longitude !== 0) {
        switch (phase) {
          case "headingToPickup":
            // Calculate progress from start location to pickup location using route distance
            pickupProgress = calculateProgress();
            // if isNearPickup is already true, don't change it back to false
            // but set it to true if driver is within 500 feet of pickup location
            if (isSameLocation(driverLocationRef.current, pickUpLocation)) {
              setIsNearPickup(true);
            }
            setIsNearDropoff(false); // Not near dropoff yet
            break;
          case "waitingForPickup":
            pickupProgress = 1; // At pickup location
            setIsNearPickup(true);
            setIsNearDropoff(false);
            break;
          case "headingToDropoff":
            // Calculate progress from pickup to dropoff using route distance
            pickupProgress = 1; // Already at pickup
            dropoffProgress = calculateProgress();
            // if isNearDropoff is already true, don't change it back to false
            // but set it to true if driver is within 500 feet of dropoff location
            if (isSameLocation(driverLocationRef.current, dropOffLocation)) {
              setIsNearDropoff(true);
            }
            setIsNearPickup(false); // Not near pickup anymore
            break;
          case "arrivedAtDropoff":
            pickupProgress = 1; // Already at pickup
            dropoffProgress = 1; // Already at dropoff
            setIsNearPickup(false); // Not near pickup anymore
            setIsNearDropoff(true); // At dropoff location
            break;
          default:
            setIsNearPickup(false);
            setIsNearDropoff(false);
            break;
        }
        setPickupProgress(pickupProgress);
        setDropoffProgress(dropoffProgress);
      }
    }
  }, [
    driverLocationRef.current,
    phase,
    whichComponent.current,
    requestInfo.current.requestId,
  ]);

  // Calculate progress based on total distance and remaining distance for non-linear tracking
  const calculateProgress = (): number => {
    if (phase === "headingToPickup") {
      const remainingDistance = mapRef.current?.pickupDistance || 0;
      // if map renders for first time, set totalDistance
      if (totalPickupDistance === 0 && remainingDistance > 0) {
        setTotalPickupDistance(remainingDistance);
        // return 0 progress since ride should not have started yet
        return 0;
      }

      // Only calculate progress if we have both total and remaining distance
      if (totalPickupDistance > 0 && remainingDistance > 0) {
        // Progress = (Total Distance - Remaining Distance) / Total Distance
        const progress = Math.max(
          0,
          Math.min(
            1,
            (totalPickupDistance - remainingDistance) / totalPickupDistance
          )
        );
        return progress;
      }

      // set to 0 if no valid distances
      return 0;
    } else if (phase === "headingToDropoff") {
      const remainingDistance = mapRef.current?.dropoffDistance || 0;
      // if map renders for first time, set totalDistance
      if (totalDropoffDistance === 0 && remainingDistance > 0) {
        setTotalDropoffDistance(remainingDistance);
        // return 0 progress since ride should not have started yet
        return 0;
      }
      // Only calculate progress if we have both total and remaining distance
      if (totalDropoffDistance > 0 && remainingDistance > 0) {
        // Progress = (Total Distance - Remaining Distance) / Total Distance
        const progress = Math.max(
          0,
          Math.min(
            1,
            (totalDropoffDistance - remainingDistance) / totalDropoffDistance
          )
        );
        return progress;
      }
    }
    return 0;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* map component */}
      <Map
        ref={mapRef}
        startLocation={startLocation}
        pickUpLocation={pickUpLocation}
        dropOffLocation={dropOffLocation}
        studentLocation={studentLocation.current}
        userLocationChanged={userLocationChanged}
        currPhase={phase}
      />
      {/* Disconnected pop-up. Show it if the websocket is not connected */}
      <View style={styles.modalContainer}>
        <DisconnectedModal isVisible={websocketStatus != "CONNECTED"} />
      </View>
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

      {/* message pop-up modal */}
      <Message
        isVisible={messageVisible}
        onClose={() => setMessageVisible(false)}
        studentId={requestInfo.current.netid}
        driverId={netid}
      />
      {/* Message button in top right corner */}
      {phase === "headingToPickup" || phase === "waitingForPickup" && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: "66%",
            right: "5%",
            zIndex: 200,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.5,
            shadowRadius: 5,
            shadowColor: "grey",
          }}
          onPress={() => setMessageVisible(true)}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 100,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="chatbubble-ellipses"
              size={30}
              color="#4B2E83"
              style={{ transform: [{ scaleX: -1 }] }}
            />
          </View>
        </TouchableOpacity>
      )}

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
        <Legend role={"DRIVER"}></Legend>
      </View>

      {/* Decide which component to render */}
      {whichComponent.current === "noRequests" ? (
        <View style={styles.homePageComponentContainer}>
          <NoRequests
            updateSideBarHeight={setCurrentComponentHeight}
            seeIfRidesExist={seeIfRidesExist}
          />
        </View>
      ) : whichComponent.current === "requestsAreAvailable" ? (
        <View style={styles.homePageComponentContainer}>
          <RequestAvailable
            requestInfo={requestInfo.current}
            showAcceptScreen={showAcceptScreen}
            updateSideBarHeight={setCurrentComponentHeight}
            driverToPickupDuration={driverToPickupDuration}
            pickupToDropoffDuration={pickupToDropoffDuration}
            onAccept={onAccept}
            onLetsGo={onLetsGo}
          />
        </View>
      ) : whichComponent.current === "handleRide" ? (
        <View style={styles.homePageComponentContainer}>
          <HandleRide
            phase={phase}
            studentPhoneNumber={studentPhoneNumber}
            requestInfo={requestInfo.current}
            driverToPickupDuration={driverToPickupDuration}
            pickupToDropoffDuration={pickupToDropoffDuration}
            pickupProgress={pickupProgress}
            dropoffProgress={dropoffProgress}
            isNearPickup={isNearPickup}
            isNearDropoff={isNearDropoff}
            setPhase={setPhase}
            updateSideBarHeight={setCurrentComponentHeight}
            changeFlaggingAllowed={setFlaggingAllowed}
            completeRide={completeRide}
            changeNotifState={setNotifState}
            onCancel={cancelRide}
            driverArrivedAtPickup={driverArrivedAtPickup}
            driverDrivingToDropOff={driverDrivingToDropOff}
            setStudentIsLate={setStudentIsLate}
            makeCall={makeCall}
          />
        </View>
      ) : whichComponent.current === "endShift" ? (
        <View style={styles.homePageComponentContainer}>
          <ShiftIsOver updateSideBarHeight={setCurrentComponentHeight} />
        </View>
      ) : null}
    </GestureHandlerRootView>
  );
}
