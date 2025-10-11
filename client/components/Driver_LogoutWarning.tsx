import { styles } from "@/assets/styles";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Dimensions } from "react-native";

interface Props {
  onLogout: () => void;
}

export default function LogoutWarning({ onLogout }: Props) {
  const top = useRef(new Animated.Value(-1000)).current;

  useEffect(() => {
    Animated.timing(top, {
      toValue: Dimensions.get("screen").height * 0.1, // 10%
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[styles.logoutWarningContainer, { top: top, alignSelf: "center" }]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: "10%",
        }}
      >
        <FontAwesome name="warning" size={40} color="black" />
        <View style={{ width: "10%" }} />
        <Text style={{ fontSize: 20 }}>
          It's the end of your shift. Please logout.
        </Text>
      </View>
      <View style={{ height: "35%" }} />
      <Pressable
        onPress={onLogout}
        style={[styles.logoutButton, { backgroundColor: "white" }]}
      >
        <View style={styles.rowContainerButton}>
          <Ionicons
            name="exit-outline"
            size={20}
            color="black"
            style={{ marginRight: "3%" }}
          />
          <Text style={[styles.logoutButtonText, { color: "black" }]}>
            Log Out
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
