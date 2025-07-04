import { useState, useEffect, useRef } from "react";
import {
  ErrorResponse,
  RideRequest,
  RidesExistResponse,
  ViewRideRequestResponse,
  WebSocketResponse,
} from "../../../server/src/api";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Map, { MapRef } from "./map";
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
import Enroute from "@/components/Driver_Enroute";
import Flagging from "@/components/Driver_Flagging";
import WebSocketService from "@/services/WebSocketService";

export default function HomePage() {
  /* HOME PAGE STATE */
  const [whichComponent, setWhichComponent] = useState<
    "waitingForReq" | "incomingReq" | "enRoute" | "arrived" | "endShift"
  >("waitingForReq");

  /* USE EFFECTS */
  useEffect(() => {
    WebSocketService.addListener(cancelRideListener, "CANCEL");
    WebSocketService.addListener(ridesExistListener, "RIDES_EXIST");
    WebSocketService.addListener(viewRideListener, "VIEW_RIDE");
    WebSocketService.addListener(viewDecisionListener, "VIEW_DECISION");
    WebSocketService.addListener(reportStudentListener, "REPORT");
  }, []);

  // set the initial component based on the current time
  useEffect(() => {
    // check if the user should be logged out based on the current time
    const interval = setInterval(() => {
      // check current time and compare with the shift hours
      if (TimeService.inServicableTime()) {
        // in shift
        setWhichComponent("waitingForReq");
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

  // check if rides exist every 30 seconds
  // to see if we should notify the driver of incoming rides
  // TODO: to replace with server messaging clients after figuring out
  // corner case for rides exist (which is not the same as driver is viewing rides)
  useEffect(() => {
    let interval: number | undefined;
    if (whichComponent === "waitingForReq") {
      // if the component is waiting for a request, we should check if rides exist
      // this will be called every 30 seconds to see if there are any rides available
      interval = setInterval(() => {
        seeIfRidesExist();
      }, 1000 * 30); // check every 30 seconds
    } else {
      if (interval) {
        // if the component is not waiting for a request, clear the interval
        return () => clearInterval(interval);
      }
    }
    return () => clearInterval(interval);
  }, [whichComponent]);

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
      view: {} as ViewRideRequestResponse, // TODO: remove this
      decision: "ACCEPT",
    });
  };

  /* EN ROUTE STATE */
  // determines if the flagging functionality is do-able by the driver
  // True only for when enroute’s STATE is “waiting for pick up”,
  // “heading to drop off location”, or on PAGE “arrived”
  // All other PAGES and states should have this as FALSE
  const [flaggingAllowed, setFlaggingAllowed] = useState(false);
  const [flagPopupVisible, setFlagPopupVisible] = useState(false);

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

  const goHome = () => {
    // reset all fields
    resetAllFields();
    // see if there are more rides available
    // this function will set the current component to "waitingForReq" or "incomingReq"
    seeIfRidesExist();
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
    setWhichComponent("waitingForReq");
  };

  /* END SHIFT STATE */

  /* WEBSOCKET Listeners */
  // WEBSOCKET - CANCEL
  const cancelRideListener = (message: WebSocketResponse) => {
    // recived a message that ride is cancelled
    if ("response" in message && message.response === "CANCEL") {
      // if successful, set the current component to "waitingForReq"
      resetAllFields();
      setWhichComponent("waitingForReq");
      setNotifState({
        text: "Ride cancelled successfully",
        color: "#4B2E83",
        boldText: "cancelled",
      });
    } else {
      // if not successful, log the error
      const errMessage = message as ErrorResponse;
      console.log("Failed to cancel ride: ", errMessage.error);
    }
  };

  // WEBSOCKET - RIDES_EXIST
  const ridesExistListener = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "RIDES_EXIST") {
      const ridesExistMessage = message as RidesExistResponse;
      if (ridesExistMessage.ridesExist) {
        // if true, set the component to "incomingReq"
        setWhichComponent("incomingReq");
        setNotifState({
          text: "New ride request available",
          color: "#4B2E83",
          boldText: "new ride",
        });
      } else {
        // if false, set the component to "waitingForReq"
        setWhichComponent("waitingForReq");
      }
    } else {
      const errMessage = message as ErrorResponse;
      console.log("Failed to see if rides exist: ", errMessage.error);
    }
  };

  // WEBSOCKET - VIEW_RIDE
  const viewRideListener = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "VIEW_RIDE") {
      const viewReqResponse = message as ViewRideRequestResponse;
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
      } else {
        // if the ride request info does not exist, then the view was not successful
        // if not successful, show a notification and set currentComponent to "waitingForReq"
        setNotifState({
          text: "The ride you were trying to view does not exist anymore.",
          color: "#FF0000",
        });
        setWhichComponent("waitingForReq"); // go to no requests page TODO: check this is correct behavior
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
      if ("success" in message && message.success == true) {
        // if the decision was successful, set the current component to "enRoute"
        setNotifState({
          text: "Ride accepted successfully",
          color: "#4B2E83",
          boldText: "accepted",
        });
        setWhichComponent("enRoute");
      } else {
        // if the decision was not successful, show a notification and set currentComponent to "waitingForReq"
        setNotifState({
          text: "Failed to accept ride request",
          color: "#FF0000",
        });
        setWhichComponent("waitingForReq"); // go to no requests page TODO: check this is correct behavior
      }
    } else {
      const errMessage = message as ErrorResponse;
      console.log("Failed to accept ride request: ", errMessage.error);
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
          color: "#4B2E83",
          boldText: "flagged",
        });
      } else {
        // if not successful, show a notification that the student could not be flagged
        setNotifState({
          text: "Failed to flag student",
          color: "#FF0000",
        });
        setFlagPopupVisible(false); // close the flagging popup
      }
    } else {
      const errMessage = message as ErrorResponse;
      console.log("Failed to flag student: ", errMessage.error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* map component */}
      <Map
        ref={mapRef}
        pickUpLocation={pickUpLocation}
        dropOffLocation={dropOffLocation}
        userLocationChanged={(location) => setDriverLocation(location)}
      />
      {/* TODO: This is currently the student profile pop-up modal */}
      <View style={styles.modalContainer}>
        <Profile
          isVisible={profileVisible}
          onClose={() => setProfileVisible(false)}
          netid={netid}
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
            <Ionicons name="menu" size={35} color="#4B2E83" />
          </View>
        </TouchableOpacity>
      </View>

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

      {/* Flag button in top right corner*/}
      {flaggingAllowed && (
        <View
          style={{
            position: "absolute",
            right: 10,
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
            onPress={() => setFlagPopupVisible(true)}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 100,
              }}
            >
              <Ionicons name="flag" size={35} color="#4B2E83" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Flagging Pop-up */}
      {flagPopupVisible && (
        <Flagging
          onFlag={flagStudent}
          closePopUp={() => setFlagPopupVisible(false)}
        />
      )}

      {/* Decide which component to render */}
      {whichComponent === "waitingForReq" ? (
        <View style={styles.homePageComponentContainer}>
          <NoRequests updateSideBarHeight={setCurrentComponentHeight} />
        </View>
      ) : whichComponent === "incomingReq" ? (
        <View style={styles.homePageComponentContainer}>
          <RequestAvailable
            requestInfo={requestInfo}
            driverToPickupDuration={driverToPickupDuration}
            pickupToDropoffDuration={pickupToDropoffDuration}
            onAccept={onAccept}
            onLetsGo={onLetsGo}
          />
        </View>
      ) : whichComponent === "enRoute" ? (
        <View style={styles.homePageComponentContainer}>
          <Enroute
            requestInfo={requestInfo}
            driverToPickupDuration={driverToPickupDuration}
            pickupToDropoffDuration={pickupToDropoffDuration}
            changeFlaggingAllowed={setFlaggingAllowed}
            goHome={goHome}
            changeNotifState={setNotifState}
            onCancel={cancelRide}
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
    </SafeAreaView>
  );
}
