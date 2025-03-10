import { styles } from "@/assets/styles";
import PopUpModal from "@/components/PopUpModal";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { User } from "../../../server/src/api";

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
    <View>
      <View style={{ height: 60 }} />
      <Text style={styles.faqHeader}>{user.netid}</Text>
      {user.preferredName && (
        <Text style={styles.faqSubtitle}>
          Preferred Name: {user.preferredName}
        </Text>
      )}
      <Text style={styles.faqSubtitle}>Given Name: {user.firstName}</Text>
      <Text style={styles.faqSubtitle}>Last Name: {user.lastName}</Text>
      <Text style={styles.faqSubtitle}>Phone Number: {user.phoneNumber}</Text>
      <Text style={styles.faqSubtitle}>
        Student Number: {user.studentNumber}
      </Text>
      <Text style={styles.faqSubtitle}>Role: {user.studentOrDriver}</Text>
      <Pressable style={styles.button} onPress={() => setSignedIn(false)}>
        <Text style={{ color: "#FFFffF", fontSize: 16 }}>Sign Out</Text>
      </Pressable>
    </View>
  );

  // Profile signout behavior
  if (signedIn === false) {
    return (
      <Redirect
        href={{
          pathname: "/driverOrstudent",
        }}
      />
    );
  }
  return <PopUpModal isVisible={isVisible} onClose={onClose} content={info} />;
}

export default Profile;
