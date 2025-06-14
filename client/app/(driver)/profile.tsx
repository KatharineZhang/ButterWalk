// components/profile.tsx
import { styles } from "@/assets/styles";
import PopUpModal from "@/components/Student_PopUpModal";
import { Redirect } from "expo-router";
import { JSX, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { User } from "../../../server/src/api";
import WebSocketService from "@/services/WebSocketService";
import { Ionicons } from "@expo/vector-icons";

interface ProfileProps {
  isVisible: boolean;
  onClose: () => void;
  user: User;
}

export default function Profile({ isVisible, onClose, user }: ProfileProps) {
  const [signedOut, setSignedOut] = useState(false);

  const content: JSX.Element = (
    <View style={{ justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Ionicons name="person-circle" size={100} color="#4B2E83" />

      <View style={{ height: 20 }} />
      <Text style={[styles.faqHeader, { textAlign: "center" }]}>
        {user.preferredName ?? `${user.firstName} ${user.lastName}`}
      </Text>

      <View style={{ height: 10 }} />
      <View style={styles.profileItemContainer}>
        <Text style={styles.profileItem}>NetID: {user.netid}</Text>
      </View>

      <View style={styles.profileItemContainer}>
        <Text style={styles.profileItem}>Phone: {user.phoneNumber ?? "—"}</Text>
      </View>

      <View style={styles.profileItemContainer}>
        <Text style={styles.profileItem}>
          Role: {user.studentOrDriver === "DRIVER" ? "Driver" : "Student"}
        </Text>
      </View>

      <View style={{ height: 30 }} />
      <Pressable
        style={{
          borderColor: "red",
          borderWidth: 2,
          width: "100%",
          height: 50,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 8,
        }}
        onPress={() => setSignedOut(true)}
      >
        <Text style={{ color: "red", fontSize: 16 }}>Sign Out</Text>
      </Pressable>
    </View>
  );

  if (signedOut) {
    WebSocketService.send({ directive: "DISCONNECT" });
    return <Redirect href={{ pathname: "/driverOrstudent" }} />;
  }

  return (
    <PopUpModal
      isVisible={isVisible}
      onClose={onClose}
      type="full"
      content={content}
    />
  );
}
