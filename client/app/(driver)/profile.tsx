// components/profile.tsx
import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, View, Text } from "react-native";
import WebSocketService from "@/services/WebSocketService";

interface ProfileProps {
  isVisible: boolean;
  onClose: () => void;
  netid: string;
}

export default function Profile({ isVisible, onClose, netid }: ProfileProps) {
  const [signedOut, setSignedOut] = useState(false);

  if (signedOut) {
    WebSocketService.send({ directive: "DISCONNECT" });
    return <Redirect href={{ pathname: "/driverOrstudent" }} />;
  }

  // TODO: fix this styling!!
  return isVisible ? (
    <View>
      <Pressable
        onPress={onClose}
        style={{ padding: 10, backgroundColor: "lightgray", borderRadius: 5 }}
      >
        <Text>Close Profile</Text>
      </Pressable>
      <Pressable
        onPress={() => setSignedOut(true)}
        style={{
          padding: 10,
          backgroundColor: "red",
          borderRadius: 5,
          marginTop: 10,
        }}
      >
        <Text style={{ color: "white" }}>Sign Out</Text>
      </Pressable>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>Profile</Text>
        <Text style={{ marginTop: 10 }}>NetID: {netid}</Text>
        {/* Add more profile details here */}
      </View>
    </View>
  ) : null;
}
