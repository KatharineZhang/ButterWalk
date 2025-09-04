import { View, Text } from "react-native";
import LogoutWarning from "./Driver_LogoutWarning";
import WebsocketService from "../services/WebSocketService";
import { useState } from "react";
import { Redirect } from "expo-router";

type ShiftIsOverProps = {
  updateSideBarHeight: (height: number) => void;
};

export default function ShiftIsOver({ updateSideBarHeight }: ShiftIsOverProps) {
  const [signedIn, setSignedIn] = useState(true);

  if (signedIn === false) {
    // disconnect user from the websocket connection
    WebsocketService.send({ directive: "DISCONNECT" });
    return (
      <Redirect
        href={{
          pathname: "/driverOrstudent",
        }}
      />
    );
  }

  return (
    <View style={{ height: "100%", justifyContent: "flex-end" }}>
      <LogoutWarning onLogout={() => setSignedIn(false)} />
      <View
        style={{
          bottom: 0,
          width: "100%",
          backgroundColor: "white",
          paddingHorizontal: 16,
          borderRadius: 10,
          paddingVertical: "10%",
        }}
        onLayout={(event) => {
          // on render, update the sidebar height to the height of this component
          updateSideBarHeight(event.nativeEvent.layout.height);
        }}
      >
        <View style={{ height: "1%" }} />
        {/* Title */}
        <Text style={{ fontSize: 25, fontWeight: "bold" }}>
          Your Shift is Over
        </Text>
        <View style={{ height: "10%" }} />
        <Text style={{ fontSize: 15 }}>
          Log back in when it is your next shift to see new requests.
        </Text>
      </View>
    </View>
  );
}
