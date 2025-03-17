import { styles } from "@/assets/styles";
import PopUpModal from "@/components/PopUpModal";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { User } from "../../../server/src/api";
import WebsocketService from "../../services/WebSocketService";
import { Ionicons } from "@expo/vector-icons";

// Profile component that displays a list of frequently asked questions
// takes in props on if the Profile modal should be shown and a function to close the modal
// this allows the modal to be controlled in an extrnal component
interface ProfileProps {
  isVisible: boolean;
  onClose: () => void;
  user: User;
}

function Profile({ isVisible, onClose, user }: ProfileProps) {
  const [signedIn, setSignedIn] = useState(true);

  // the stuff that goes in the modal
  const info: JSX.Element = (
    <View style={{justifyContent: "center", alignItems: "center"}}>
      <View style={{ height: 60 }} />
      <Text style={[styles.faqHeader, {alignSelf:"center"}]}>{user.netid}</Text>
      <View style={{ height: 10 }} />
      <Ionicons name="person-circle" size={100} color="#4B2E83" />
      <View style={{ height: 10 }} />
      {user.preferredName && (
        <View style={styles.profileItemContainer}>
        <Text style={styles.profileItem}>
          Preferred Name: {user.preferredName}
        </Text>
      </View>
      )}
      <View style={styles.profileItemContainer}>
      <Text style={styles.profileItem}>Given Name: {user.firstName}</Text>
      </View>
      <View style={styles.profileItemContainer}>
      <Text style={styles.profileItem}>Last Name: {user.lastName}</Text>
      </View>
      <View style={styles.profileItemContainer}>
      <Text style={styles.profileItem}>Phone Number: {user.phoneNumber}</Text>
      </View>
      <View style={styles.profileItemContainer}>
      <Text style={styles.profileItem}>
        Student Number: {user.studentNumber}
      </Text>
      </View>
      <View style={styles.profileItemContainer}>
      <Text style={styles.profileItem}>Role: {user.studentOrDriver}</Text>
      </View>
      <View style={{ height: 10 }} />
      <Pressable style={styles.button} onPress={() => setSignedIn(false)}>
        <Text style={{ color: "#FFFffF", fontSize: 16 }}>Sign Out</Text>
      </Pressable>
    </View>
  );

  // Profile signout behavior
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
    <PopUpModal
      isVisible={isVisible}
      onClose={onClose}
      type="full"
      content={info}
    />
  );
}

export default Profile;