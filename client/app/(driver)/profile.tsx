// components/profile.tsx
import { Redirect } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
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

  return <View></View>;
}
