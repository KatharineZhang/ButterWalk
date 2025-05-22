import { useState, useEffect, useRef } from "react";
import moment from "moment";
import momentTimezone from "moment-timezone";
import WebSocketService from "@/services/WebSocketService";
import { RequestRideResponse, DriverAcceptResponse, WebSocketResponse } from "../../../server/src/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, View } from "react-native";
import Map from "./map";
import { useLocalSearchParams } from "expo-router";

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
            setWhichComponent("waitingForReq")
        } else { // off shift
            setShiftEnded(true);
            setWhichComponent("endShift");
        }
        
    }, []);

    // state for incoming ride request
    const [requestInfo, setRequestInfo] = useState<RequestRideResponse | null>(null);
    const [receivedReq, setReceivedReq] = useState(false);

    // use effect for incoming ride requests
    useEffect(() => {
      WebSocketService.addListener(handleIncomingRequest, "REQUEST_RIDE");

      return() => {
        Web // finish code here
      }
    })

    // WebSocket call that tells us a new ride has come in
    const handleIncomingRequest = (message: WebSocketResponse) => {
      if ("response" in message && message.response === "REQUEST_RIDE") {
        const reqMessage = message as RequestRideResponse;
        setRequestInfo(reqMessage);
        setReceivedReq(true);
        setWhichComponent("incomingReq");
      } else {
        console.log("Request ride error: ", message);
        setWhichComponent("waitingForReq");
      }
    }
    
    
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

    return (
        <SafeAreaView>
            {/* put in params later */}
            <Map/>
            {whichComponent === "waitingForReq" && !shiftEnded ? (
                <View>
                    <Text>Waiting for ride request...</Text>
                </View>
            ) : 
            whichComponent === "incomingReq" && requestInfo && !shiftEnded ? (
                <View>
                    <Text>Incoming Ride Request</Text>
                    <Text>Pickup Location: {requestInfo.pickupLocation}</Text>
                    <Text>Dropoff Location: {requestInfo.dropoffLocation}</Text>
                    <Button title="Accept" onPress={() => setWhichComponent("acceptRideReq")} />
                </View>
            ) :
            whichComponent === "acceptRideReq" && requestInfo && !shiftEnded ? (
                <View>
                    <Text>Accept Ride Request</Text>
                    <Text>Passenger: {requestInfo.name}</Text>
                    <Text>Pickup Location: {requestInfo.pickupLocation}</Text>
                    <Text>Dropoff Location: {requestInfo.dropoffLocation}</Text>
                    <Text>Travel Time to Pickup: {requestInfo.timeToPickup}</Text>
                    <Text>Travel Time to Drop Off: {requestInfo.timeToDropoff}</Text>
                    <Button title="Let's go" onPress={() => setWhichComponent("enRoute")} />
                </View>
            ) : 
            // change to enRouteToPickup and enRouteToDropoff
            whichComponent === "enRoute" && !shiftEnded ? (
                <View>
                    <Text>En Route to Pickup</Text>
                    <Text>Pickup Location: {requestInfo.pickupLocation}</Text>
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