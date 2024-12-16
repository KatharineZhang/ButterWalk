import React from "react";
import MapView from "react-native-maps";
import { StyleSheet, View } from "react-native";

//Just a component for the <MapView> feature
//Currently defaults u to some spot between edmonds and kingston bc i was trying to figure out the coords to have it default to UW
//but it wouldnt work T^T (but at least its kind of close B))
export default function App() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 47.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
    </View>
  );
}

//Styling stuff
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
