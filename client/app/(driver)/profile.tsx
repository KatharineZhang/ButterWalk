/* eslint-disable @typescript-eslint/no-require-imports */
import { Pressable, View, Text, Image } from "react-native";
import { styles } from "../../assets/styles";

interface ProfileProps {
  isVisible: boolean;
  netid: string;
  onClose: () => void;
  onLogOut: () => void;
}

export default function Profile({
  isVisible,
  onClose,
  onLogOut,
  netid,
}: ProfileProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Image
            source={require("@/assets/images/close_button_profile.png")}
            style={styles.closeButtonImage}
          />
        </Pressable>

        <View style={styles.rowContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={require("@/assets/images/Ellipse 215.png")}
              style={styles.ellipseImage}
            />
            <Image
              source={require("@/assets/images/user.png")}
              style={styles.userImage}
            />
          </View>
          <Text style={styles.title}>Driver NetID: {netid}</Text>
        </View>

        <Pressable onPress={onLogOut} style={styles.logoutButton}>
          <View style={styles.rowContainerButton}>
            <Image
              source={require("@/assets/images/sign-out-alt.png")}
              style={styles.logoutImage}
            />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
