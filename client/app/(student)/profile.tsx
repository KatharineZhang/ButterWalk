import { styles } from "@/assets/styles";
import PopUpModal from "@/components/PopUpModal";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

// Profile component that displays a list of frequently asked questions
// takes in props on if the Profile modal should be shown and a function to close the modal
// this allows the modal to be controlled in an extrnal component
interface ProfileProps {
  isVisible: boolean;
  onClose: () => void;
  netid: string;
}

function Profile({ isVisible, onClose, netid }: ProfileProps) {
  const [signedIn, setSignedIn] = useState(true);
  // the stuff that goes in the modal
  const info: JSX.Element = (
    <View>
      <View style={{ height: 60 }} />
      <Text style={styles.faqHeader}>{netid}</Text>
      <Text style={styles.faqSubtitle}>Profile</Text>
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
