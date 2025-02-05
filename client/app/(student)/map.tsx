import React from "react";
import MapView from "react-native-maps";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "@/components/Header";

import { StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import WebSocketService from "@/services/WebSocketService";
import BottomDrawer from "@/components/BottomDrawer";

// file changes to test ride request form! 


// Home component with the <MapView> feature
// Currently defaults u to some spot between edmonds and kingston bc i was trying to figure out the coords to have it default to UW
// but it wouldnt work T^T (but at least its kind of close B))
export default function App() {
  // Extract netid from Redirect URL from signin page
  const { netid } = useLocalSearchParams();
  // Use netid to pair this WebSocket connection with a netid
  WebSocketService.connect(netid as string, "STUDENT");

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Header netid={netid as string} />
        <View style={styles.mapContainer}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: 47.78825,
              longitude: -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          />
        </View>
        <View style={styles.drawerContainer}>
          <BottomDrawer />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

// added this so that map and drawer would show up on screen
const styles = StyleSheet.create({
  mapContainer: {
    flex: 1, 
  },
  drawerContainer: {
    ...StyleSheet.absoluteFillObject, 
    justifyContent: "flex-end", 
  },
});