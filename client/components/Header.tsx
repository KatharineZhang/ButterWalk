import { View, Pressable, Text } from "react-native";
import { styles } from "../assets/styles";
import { Redirect } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import { useState } from "react";

interface HeaderProps {
  netid: string;
}

export default function Header({ netid }: HeaderProps) {
  const [signedIn, setSignedIn] = useState(true);
  const logout = () => {
    // Disconnect from websocket
    WebSocketService.close();
    setSignedIn(false);
  };

  if (!signedIn) {
    return <Redirect href={{ pathname: "/driverOrstudent" }} />;
  }

  return (
    <View style={styles.header}>
      <Text
        style={[
          styles.largeText,
          { margin: 20, fontWeight: "bold", color: "#ffffff" },
        ]}
      >
        {netid}
      </Text>
      <View style={styles.headerButtonContainer}>
        <Pressable style={styles.button} onPress={logout}>
          <Text style={{ color: "#FFFffF", fontSize: 16 }}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}
