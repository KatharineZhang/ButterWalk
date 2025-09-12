import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { styles } from "@/assets/styles";
import Onboarding from "./onboarding";
import { useKeepAwake } from "expo-keep-awake";

export default function HomeScreen() {
  useKeepAwake();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Onboarding />
      </View>
    </GestureHandlerRootView>
  );
}
