import { useState, useEffect, useRef } from "react";
import { RideRequest, WebSocketResponse } from "../../../server/src/api";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Map, { MapRef } from "./map";
import { useLocalSearchParams } from "expo-router";
import IncomingRideRequest from "@/components/Driver_RequestAvailable";
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

export default function HomePage() {
  /* HOME PAGE STATE */
  // TODO: make "incomingReq" and "acceptRideReq" the same PAGE
  const [whichComponent, setWhichComponent] = useState<
    "waitingForReq" | "incomingReq" | "enRoute" | "arrived" | "endShift"
  >("waitingForReq");

  /* USE EFFECTS */
  useEffect(() => {
    // TODO: add all the necessary listeners for the websocket connection
    // TODO: call the route to get the driver's profile
  }, []);

  // set the initial component based on the current time
  useEffect(() => {
    // check if the user should be logged out based on the current time
    const interval = setInterval(() => {
      // check current time and compare with the shift hours
      if (TimeService.inServicableTime()) {
        // in shift

        // TODO: this should be "waintingForReq" if the user is logged in. But is "incomingReq" for testing purposes
        setWhichComponent("incomingReq");
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
  const [requestInfo, setRequestInfo] = useState<RideRequest>(
    {} as RideRequest
  );

  const seeIfRidesExist = () => {
    // TODO: how often should this be called?
    // call RIDES_EXIST websocket call
  };

  /* INCOMING RIDE REQUEST STATE */
  const onAccept = () => {
    // TODO: handle the accept ride request logic (call "VIEW_RIDE")
    // use driverLocation in the request
    // to appease linter TODO: remove
    console.log(driverLocation);
  };

  // Handler for the "Let's Go" action in IncomingRideRequest
  const onLetsGo = () => {
    // TODO: implement the logic for when the driver clicks "Let's Go"
    // call the websocket call "VIEW_DECISION" with "ACCEPT" tag
  };

  /* EN ROUTE STATE */
  // determines if the flagging functionality is do-able by the driver
  // True only for when enroute’s STATE is “waiting for pick up”,
  // “heading to drop off location”, or on PAGE “arrived”
  // All other PAGES and states should have this as FALSE
  const [flaggingAllowed, setFlaggingAllowed] = useState(false);
  const [flagPopupVisible, setFlagPopupVisible] = useState(false);

  const flagStudent = () => {
    // call the REPORT route
  };

  const cancelRide = () => {
    // TODO: call the websocket call to cancel the ride
    // if successful, set the current component to "waitingForReq"
    // if not successful, log the error
  };

  const goHome = () => {
    // reset all fields
    // see if there are more rides available
    // this function will set the current component to "waitingForReq" or "incomingReq"
    seeIfRidesExist();
  };

  /* END SHIFT STATE */

  /* WEBSOCKET Listeners */

  // TODO: remove this override when we add listeners to useEffect
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const ridesExistListener = (message: WebSocketResponse) => {
    // to appease linter TODO: remove
    console.log(message);
    // if true, set the component to "incomingReq"
    // if false, set the component to "waitingForReq"
  };

  // TODO: remove this override when we add listeners to useEffect
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const viewRideListener = (message: WebSocketResponse) => {
    // to appease linter TODO: remove
    console.log(message);
    // if successful, set the requestInfo state to the ride request info
    // if not successful, show a notification and set currentComponent to "waitingForReq"

    // TODO: remove this stub once the websocket call is implemented
    setRequestInfo({
      requestId: "stub-request-id",
      netid: "stub-student-netid",
      driverid: "stub-driver-id",
      completedAt: null,
      locationFrom: {
        name: "",
        address: "",
        coordinates: {
          latitude: 0,
          longitude: 0,
        },
      }, // stub location
      locationTo: {
        name: "",
        address: "",
        coordinates: {
          latitude: 0,
          longitude: 0,
        },
      }, // stub location
      numRiders: 1,
      status: "REQUESTED",
    });

    // TODO: set the pick up and drop off locations based on the requestInfo
    setPickUpLocation({
      latitude: 0,
      longitude: 0,
    }); // stub location
    setDropOffLocation({
      latitude: 0,
      longitude: 0,
    }); // stub location

    // TODO: handle the lets go logic (websocket call "VIEW_DECISION" with "ACCEPT" tag)

    setWhichComponent("enRoute");
  };

  // TODO: remove this override when we add listeners to useEffect
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const viewDecisionListener = (message: WebSocketResponse) => {
    // to appease linter TODO: remove
    console.log(message);
    // if successful, go to enRoute component
    // if not successful, show a notification and set currentComponent to "waitingForReq"
    setWhichComponent("enRoute");
  };

  // TODO: remove this override when we add listeners to useEffect
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const reportStudentListener = (message: WebSocketResponse) => {
    // to appease linter TODO: remove
    console.log(message);
    // if successful, show a notification that the student has been flagged
    setFlagPopupVisible(false);
    setNotifState({
      text: "Student has been flagged",
      color: "#4B2E83",
      boldText: "flagged",
    });
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
          <IncomingRideRequest
            requestInfo={requestInfo}
            onAccept={onAccept}
            onLetsGo={onLetsGo}
            changeNotifState={setNotifState}
          />
        </View>
      ) : whichComponent === "enRoute" ? (
        <View style={styles.homePageComponentContainer}>
          <Enroute
            requestInfo={requestInfo}
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
