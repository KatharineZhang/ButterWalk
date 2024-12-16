import { styles } from "@/assets/styles";
import { View } from "react-native";
import Onboarding from "./onboarding";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Onboarding></Onboarding>
    </View>
  );
}
