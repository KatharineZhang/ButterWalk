//import WebSocketService from "@/services/WebSocketService";
//import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, TextInput, Button, Text, Pressable } from "react-native";
import { WebSocketResponse } from "../../server/src/api";
import { styles } from "@/assets/styles";

export default function RideRequestForm() {
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();

  // Use netid to pair this WebSocket connection with a netid
  WebSocketService.connect(netid as string, "STUDENT");

  // user input states
  const [phoneNum, setPhoneNum] = useState("");
  const [location, setLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [numRiders, setNumRiders] = useState(1);
  const [message, setMessage] = useState("");

  // This function will be called whenever the server sends a message 
  const handleMessage = (message: WebSocketResponse) => {
    console.log("Received message:", message);
    setMessage(JSON.stringify(message));
  }
  // Add the listener to the WebSocketService
  WebSocketService.addListener(handleMessage, "REQUEST_RIDE");

  // Send form information to server
  const handleSend = () => {
    WebSocketService.send({ 
      directive: "REQUEST_RIDE", 
      phoneNum, 
      netid: Array.isArray(netid) ? netid[0] : netid,
      location, 
      destination, 
      numRiders });
  }

  return (
    <View>
      <View style={{marginVertical: 5}}></View>
      <Text>Ride Request</Text>
      <View>
        <Text>Phone Number:</Text>
        <TextInput
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          placeholder="Enter phone number"
          value={phoneNum}
          onChangeText={setPhoneNum}
        />
        <Text>Location:</Text>
        <TextInput
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          placeholder="Enter location"
          value={location}
          onChangeText={setLocation}
        />
        <Text>Destination:</Text>
        <TextInput
          style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          placeholder="Enter destination"
          value={destination}
          onChangeText={setDestination}
        />
        <Text>Number of Riders:</Text>
        <TextInput
          keyboardType="numeric"
          value={numRiders.toString()}
          onChangeText={(text) => setNumRiders(Number(text))}
        />

      </View>
      <Pressable onPress={handleSend}><Text style={{color:"blue"}}>Send</Text></Pressable>
    </View>
  );
}


// fuzzy search, autocomplete search bar, css styling, drawer slide up from bottom
// number of passengers UI, people incrementing decrementing with plus or minus
