import React from "react";
import MapView from "react-native-maps";
import { Pressable, View, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { styles } from "@/assets/styles";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";

// Home component with the <MapView> feature
// Currently defaults u to some spot between edmonds and kingston bc i was trying to figure out the coords to have it default to UW
// but it wouldnt work T^T (but at least its kind of close B))
export default function App() {
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();
  // Use netid to pair this WebSocket connection with a netid
  WebSocketService.connect(netid as string);

  const signin = () => {
    WebSocketService.send({
      directive: "SIGNIN",
      netid: netid as string,
      name: "bibbity",
      phoneNum: "1500",
      studentNum: "12345678",
      role: 0,
    })
  };

  const requestRide = () => {
    WebSocketService.send({
      directive: "REQUEST_RIDE",
      netid: "mom",
      phoneNum: "1500",
      location: "123 fake street",
      destination: "456 real street",
      numRiders: 1,
    })
  }

  const acceptRide = () => {
    WebSocketService.send({
      directive: "ACCEPT_RIDE",
      driverid: "lightningMcQueen",
    })
  }

  const cancelRide = () => {
    WebSocketService.send({
      directive: "CANCEL",
      netid: "lightningMcQueen",
      role: 1
    })
  }

  const completeRide = () => {
    WebSocketService.send({
      directive: "COMPLETE",
      requestid: "m185oFaqhQ2FFHGlQryX",
    })
  }

  const addFeedback = () => {
    WebSocketService.send({
      directive: "ADD_FEEDBACK",
      rating: 5,
      feedback: "very cool",
      appOrRide: 1,})
  }

  const report = () => {
    WebSocketService.send({
      directive: "REPORT",
      netid: netid as string,
      requestid: "m185oFaqhQ2FFHGlQryX",
      reason: "they were mean",
    })
  }

  const blacklist = () => {
    WebSocketService.send({
      directive: "BLACKLIST",
      netid: "bob",
    })
  }

  const waitTime = () => {
    WebSocketService.send({
      directive: "WAIT_TIME",
      requestid: "aLQ0ZFeAGPaOkdBHIjc9",
      pickupLocation: [1, 2],
    })
  }

  const query = () => {
    WebSocketService.send({
      directive: "QUERY",
      date: {start: new Date('2025-1-20'), end: new Date('2025-01-21')},
    })
  }
  return (
    <View style={styles.container}>
      <Pressable onPress={signin}>
        <Text style={{color:'blue'}}>Sign in</Text>
      </Pressable>
      <View style={{ height: 20 }} />
      <Pressable onPress={requestRide}>
        <Text style={{color:'blue'}}>Request</Text>
      </Pressable>
      <View style={{ height: 20 }} />
      <Pressable onPress={acceptRide}>
        <Text style={{color:'blue'}}>Accept</Text>
      </Pressable>
      <View style={{ height: 20 }} />
      <Pressable onPress={cancelRide}>
        <Text style={{color:'blue'}}>Cancel</Text>
      </Pressable>
      <View style={{ height: 20 }} />
      <Pressable onPress={completeRide}>
        <Text style={{color:'blue'}}>Complete</Text>
      </Pressable>
      <View style={{ height: 20 }} />
      <Pressable onPress={addFeedback}>
        <Text style={{color:'blue'}}>Feedback</Text>
      </Pressable>
      <View style={{ height: 20 }} />
      <Pressable onPress={report}>
        <Text style={{color:'blue'}}>Report</Text>
      </Pressable>
      <View style={{ height: 20 }} />
      <Pressable onPress={blacklist}>
        <Text style={{color:'blue'}}>Blacklist</Text>
      </Pressable>
      <View style={{ height: 20 }} />
      <Pressable onPress={waitTime}>
        <Text style={{color:'blue'}}>Wait</Text>
      </Pressable>
      <View style={{ height: 20 }} />
      <Pressable onPress={query}>
        <Text style={{color:'blue'}}>Query</Text>
      </Pressable>
      {/* <SafeAreaProvider style={{ flex: 1 }} />
      <Header netid={netid as string} />
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 47.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      ></MapView> */}
    </View>
  );
}
