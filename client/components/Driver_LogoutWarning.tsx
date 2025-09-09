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
    <Animated.View style={[styles.logoutWarningContainer, { top: top }]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <FontAwesome name="warning" size={40} color="black" />
        <View
          style={{
            width: "80%",
          }}
        >
          <Text style={{ fontSize: 18 }}>
            It's the end of your shift. Please logout.
          </Text>
        </View>
      </View>
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
