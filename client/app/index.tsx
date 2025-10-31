import "react-native-gesture-handler";
import "react-native-reanimated";
import { styles } from "@/assets/styles";
import { View } from "react-native";
import Onboarding from "./onboarding";
import { useKeepAwake } from "expo-keep-awake";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function HomeScreen() {
  useKeepAwake();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Onboarding></Onboarding>
      </View>
    </GestureHandlerRootView>
  );
}
