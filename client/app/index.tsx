import { styles } from "@/assets/styles";
import { View } from "react-native";
import Onboarding from "./onboarding";
import { useKeepAwake } from "expo-keep-awake";

export default function HomeScreen() {
  useKeepAwake();
  return (
    <View style={styles.container}>
      <Onboarding></Onboarding>
    </View>
  );
}
