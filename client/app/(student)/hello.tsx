import { styles } from "@/assets/styles";
import { Redirect } from "expo-router";
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

export default function Hello() {
  const [goBack, setGoBack] = useState(false);

  if (goBack) {
    return (
      <Redirect
        href={{
          pathname: "/driverOrstudent",
        }}
      />
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <MapView
        // ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 47.65462693267042,
          longitude: -122.30938853301136,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        userInterfaceStyle="light"
        provider={PROVIDER_GOOGLE} // Use Google Maps for the map
      ></MapView>
      <View
        style={{
          position: "absolute",
          zIndex: 100,
          backgroundColor: "pink",
          padding: 20,
          borderRadius: 10,
        }}
      >
        <Text>Hello, Student!</Text>
        <Pressable
          onPress={() => {
            setGoBack(true);
          }}
          style={{ padding: 10, backgroundColor: "blue", borderRadius: 5 }}
        >
          <Text style={{ color: "white" }}>Go to Home</Text>
        </Pressable>
      </View>
    </View>
  );
}
