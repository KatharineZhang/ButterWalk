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

export default function HomePage() {
    /* Driver netId prop passed in through sign in
    TODO: fix this once we actually get driver netId from UWPD */
    const { netid } = useLocalSearchParams<{ netid: string }>();

    
    const [whichComponent, setWhichComponent] = useState<
    "waitingForReq" | "incomingReq" | "acceptRideReq" | "enRoute" | "endShift">("waitingForReq");
    const[shiftEnded, setShiftEnded] = useState(false);

    // what is rendered when home page is first loaded
    useEffect(() => {
        // check current time and compare with the shift hours
        const currentHr : number = Number(momentTimezone.tz(moment.tz.guess()).format("HH"));
        if(currentHr < 18 || currentHr > 1) { // in shift
            setWhichComponent("incomingReq")
        } else { // off shift
            setShiftEnded(true);
            setWhichComponent("endShift");
        }
        
    }, []);

    // state for incoming ride request
  const [requestInfo, setRequestInfo] = useState<RequestRideResponse | null>(
      null
    );
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
          setWhichComponent("acceptRideReq");
        }
      };

      WebSocketService.addListener(handleAcceptRequest, "ACCEPT_RIDE")

      return () => {
        WebSocketService.removeListener(handleAcceptRequest, "ACCEPT_RIDE")
      }
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
            whichComponent === "endShift" && !shiftEnded ? (
                <View>
                    <Text>Your shift has ended. Please log out.</Text>
                </View>
            ) : null}
        </SafeAreaView>
    );
}