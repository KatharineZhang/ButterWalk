import { useState, useEffect, useRef } from "react";
import moment from "moment";
import momentTimezone from "moment-timezone";
import WebSocketService from "@/services/WebSocketService";
import { RequestRideResponse, DriverAcceptResponse, WebSocketResponse } from "../../../server/src/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, View } from "react-native";
import Map from "./map";
import { useLocalSearchParams } from "expo-router";
import IncomingRideRequest from "./incomingRideRequest";
import LogoutWarning from "../../components/LogoutWarning";

export default function HomePage() {
    /* Driver netId prop passed in through sign in
    TODO: fix this once we actually get driver netId from UWPD */
    const { netid } = useLocalSearchParams<{ netid: string }>();

    // TODO: make "incomingReq" and "acceptRideReq" the same PAGE
    const [whichComponent, setWhichComponent] = useState<
    "waitingForReq" | "incomingReq" | "enRoute" | "arrived" | "endShift">("waitingForReq");
    const[shiftEnded, setShiftEnded] = useState(false);

    // if the user is currently logged in or not
    const[isLoggedIn, setIsLoggedIn] = useState(true);

    // determines if the flagging functionality is do-able by the driver
    // True only for when enroute’s STATE is “waiting for pick up”, 
    // “heading to drop off location”, or on PAGE “arrived”
    // All other PAGES and states should have this as FALSE
    // TODO: create callback function for components to alter this state
    const [showFlag, setShowFlag] = useState(false);

    // the driver's location
    const [driverLocation, setDriverLocation] = useState<{
      latitude: number;
      longitude: number;
    }>({ latitude: 0, longitude: 0 });

    // when the driver's current location changes,
    // the map will call this function to alert the home page of the change
    // updates home page's record of the user's location
    // TODO: make this callback fucntion for the <Map> prop to send user location back to home.tsx
    const userLocationChanged = (location: {
      latitude: number;
      longitude: number;
    }) => {
      setDriverLocation(location);
    };

    // what is rendered when home page is first loaded
    useEffect(() => {
        // check current time and compare with the shift hours
        const currentHr : number = Number(momentTimezone.tz(moment.tz.guess()).format("HH"));
        if(currentHr < 18 || currentHr > 1) { // in shift
          if(netid != null) {
            setWhichComponent("incomingReq")
          } else {
            setIsLoggedIn(false);
            console.error("netid is null when loading homepage. This should not happen");
          }
            
        } else { // off shift
            setShiftEnded(true);
            setWhichComponent("endShift");
        }
        
    }, []);

    // state for incoming ride request
    const [requestInfo, setRequestInfo] = useState<RequestRideResponse | null>(
      null
    );
    
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

    // if the driver has accepted the ride or not
    const [driverAcceptInfo, setDriverAcceptInfo] = useState<
      DriverAcceptResponse | null
    >(null);
    const [showRoute, setShowRoute] = useState(false);

    // use effect for incoming ride requests
    useEffect(() => {
      const handleIncoming = (msg: WebSocketResponse) => {
        if ("response" in msg && msg.response === "REQUEST_RIDE") {
          const req = msg as RequestRideResponse;
          setRequestInfo(req);
          setDriverAcceptInfo(null); // reset any old accept
          setWhichComponent("incomingReq");
        }
      };

      WebSocketService.addListener(handleIncoming, "REQUEST_RIDE");
      return () => {
        WebSocketService.removeListener(handleIncoming, "REQUEST_RIDE");
      };
    }, []);
    
    
    // Accept Ride Request Logic
    useEffect(() => {
      // Handler for ACCEPT RIDE
      function handleAcceptRequest(message: WebSocketResponse) {
        if ("response" in message && message.response === "ACCEPT_RIDE") {
          setDriverAcceptInfo(message as DriverAcceptResponse);
          // No need to change the component; we stay on incomingReq
        }
      };

      WebSocketService.addListener(handleAcceptRequest, "ACCEPT_RIDE");

      return () => {
        WebSocketService.removeListener(handleAcceptRequest, "ACCEPT_RIDE");
      };
    }, []);

    function handleAcceptRequest(): void {
      // don’t do anything if we don’t yet have a request
      if (!requestInfo) {
        return;
      }
    
      const payload = {
        response: 'ACCEPT_RIDE' as const,
        requestid: requestInfo.requestid,
        driverNetid: netid,
      };
    
      WebSocketService.send(payload as any);
    }
    
    function handleLetsGo(): void {
      // start drawing the route on the map
      setShowRoute(true);
    
      // switch into the “enRoute” view
      setWhichComponent('enRoute');
    }
    
    function handleLogout() {
      setIsLoggedIn(false);
    }

    // TODO: if shiftEnded && isLoggedIn, display the "need to log out" component
    return (
        <SafeAreaView style={{ flex: 1 }}>
            {/* put in params later */}
            {/* <Map/> && requestInfo && !shiftEnded*/}
            <Map/>
            {whichComponent === "waitingForReq" && !shiftEnded ? (
                <View>
                    <Text>Waiting for ride request...</Text>
                </View>
            ) : 
            whichComponent === "incomingReq" ? (
              <IncomingRideRequest
                requestInfo={{
                  response: "REQUEST_RIDE",
                  requestid: 'temp'
                }}
                driverAcceptInfo={driverAcceptInfo}
                onAccept={handleAcceptRequest}
                onLetsGo={handleLetsGo}
              />
            ) :
            // change to enRouteToPickup and enRouteToDropoff
            whichComponent === "enRoute" && requestInfo && !shiftEnded ? (
                <View>
                    <Text>En Route to Pickup</Text>
                    <Text>Pickup Location: {"Pick up location"}</Text>
                </View>
            ) :
            whichComponent === "endShift" ? (
              isLoggedIn ? (
                <LogoutWarning onLogout={() => handleLogout} />
              ) : (
                <View>
                    <Text>You are logged out.</Text>
                </View>
              )
            ) : null}
        </SafeAreaView>
    );
}