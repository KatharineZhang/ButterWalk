import { View, Text } from "react-native";
import { styles } from "@/assets/styles";
import React from "react";

//this is the ride confirmation page
export default function Tab() {
  return (
    <View style={styles.container}>
      <Text style={styles.largeText}> Ride confirmed! </Text>
    </View>
  );
}
