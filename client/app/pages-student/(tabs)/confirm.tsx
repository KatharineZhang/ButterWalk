import { View, Text, StyleSheet, Pressable } from "react-native";
import { styles } from "@/assets/styles";
import WebSocketService from "../../../services/WebSocketService";

//this is the ride confirmation page
export default function Tab() {
  const cancel = () => {
    WebSocketService.send({ directive: "CANCEL" });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.largeText}> Ride confirmed! </Text>
      <Pressable style={styles.button} onPress={cancel}>
        <Text style={{ color: "white" }}>Cancel</Text>
      </Pressable>
    </View>
  );
}
