import React from "react";
import MapView from "react-native-maps";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { styles } from "@/assets/styles";

//Just a component for the <MapView> feature
//Currently defaults u to some spot between edmonds and kingston bc i was trying to figure out the coords to have it default to UW
//but it wouldnt work T^T (but at least its kind of close B))
export default function App() {
  // TODO: plumb netid here
  return (
    <View>
      <SafeAreaProvider style={{ flex: 1 }} />
      <Header netID={"jdhkjdhf" as string} />
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 47.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      ></MapView>
    </View>
  );
}
