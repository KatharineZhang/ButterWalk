import { View, Text, Pressable } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { styles } from "@/assets/styles";
import WebSocketService from "@/services/WebSocketService";
import { useState, useEffect } from "react";
import { WebSocketResponse } from "../../../server/src/api";

// currently not in use due to bugs
export default function LoadingPage() {
  const { netid, requestid } = useLocalSearchParams();
  const [message, setMessage] = useState("");

  const handleRequestMessage = (message: WebSocketResponse) => {
    console.log("Received request message from server:", message);
    if ("response" in message && message.response === "REQUEST_RIDE") {
      setMessage(JSON.stringify(message));
    }
  };

  const handleCancelMessage = (message: WebSocketResponse) => {
    if ("info" in message && message.response === "CANCEL") {
      console.log("Received cancel message from server:", message);
      router.replace("/map");
    } else {
      alert("Failed to cancel ride. Please try again.");
    }
  };

  const sendCancel = () => {
    WebSocketService.send({
      directive: "CANCEL",
      netid: netid as string,
      role: "STUDENT",
      requestid: requestid as string,
    });
  };

  useEffect(() => {
    WebSocketService.addListener(handleRequestMessage, "REQUEST_RIDE");
    WebSocketService.addListener(handleCancelMessage, "CANCEL");

    return () => {
      WebSocketService.removeListener(handleRequestMessage, "REQUEST_RIDE");
      WebSocketService.removeListener(handleCancelMessage, "CANCEL");
    };
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          backgroundColor: "tan",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ marginBottom: 20 }}>Loading...</Text>
        <Pressable onPress={sendCancel} style={styles.sendButton}>
          <Text style={styles.cancelText}>Cancel Request</Text>
        </Pressable>
      </View>
    </>
  );
}
