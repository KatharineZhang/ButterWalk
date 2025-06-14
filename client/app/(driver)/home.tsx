import { useState, useEffect, useRef } from "react";
import { User, RideRequest } from "../../../server/src/api";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Map, { MapRef } from "./map";
import { useLocalSearchParams } from "expo-router";
import IncomingRideRequest from "@/components/IncomingRideRequest";
import Legend from "@/components/Student_Legend";
import Profile from "../(student)/profile";
import { Ionicons } from "@expo/vector-icons";
import Notification from "@/components/Notification";
import TimeService from "@/services/TimeService";
import { styles } from "@/assets/styles";
import ShiftIsOver from "@/components/ShiftOver";
import WaitingForRequest from "@/components/WaitingForRequest";

export default function HomePage() {
  /* HOME PAGE STATE */
  // TODO: make "incomingReq" and "acceptRideReq" the same PAGE
  const [whichComponent, setWhichComponent] = useState<
    "waitingForReq" | "incomingReq" | "enRoute" | "arrived" | "endShift"
  >("waitingForReq");

  // determines if the flagging functionality is do-able by the driver
  // True only for when enroute’s STATE is “waiting for pick up”,
  // “heading to drop off location”, or on PAGE “arrived”
  // All other PAGES and states should have this as FALSE
  // TODO: create callback function for components to alter this state
  const [showFlag, setShowFlag] = useState(false);

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
  const [user, setUser] = useState<User>({} as User);

  /* NOTIFICATION STATE */
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

  const onAccept = () => {
    // TODO: handle the accept ride request logic
  };
  const onLetsGo = () => {
    // TODO: handle the lets go logic
    setWhichComponent("enRoute");
  };

  /* INCOMING RIDE REQUEST STATE */

  /* EN ROUTE STATE */

  /* END SHIFT STATE */

  /* WEBSOCKET HANDLERS */

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

      {/* Decide which component to render */}
      {whichComponent === "waitingForReq" ? (
        <View style={styles.homePageComponentContainer}>
          <WaitingForRequest updateSideBarHeight={setCurrentComponentHeight} />
        </View>
      ) : whichComponent === "incomingReq" ? (
        <View style={styles.homePageComponentContainer}>
          <IncomingRideRequest
            requestInfo={requestInfo}
            onLetsGo={onLetsGo}
          />
        </View>
      ) : whichComponent === "enRoute" ? (
        <View style={styles.homePageComponentContainer}>
          <Text>En Route</Text>
            <Pressable onPress={() => setWhichComponent("incomingReq")}>
              <Text>Back to Incoming Request (for testing)</Text>
            </Pressable>
        </View>
      ) : whichComponent === "endShift" ? (
        <View style={styles.homePageComponentContainer}>
          <ShiftIsOver updateSideBarHeight={setCurrentComponentHeight} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
