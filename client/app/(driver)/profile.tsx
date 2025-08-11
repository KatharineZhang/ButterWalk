/* eslint-disable @typescript-eslint/no-require-imports */
import { Pressable, View, Text, Image, Dimensions } from "react-native";
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
          <View
            style={{
              padding: 10,
              borderRadius: 100,
              borderWidth: 3,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              style={{
                width: Dimensions.get("window").width * 0.07,
                height: Dimensions.get("window").width * 0.07,
              }}
              source={require("@/assets/images/user.png")}
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
