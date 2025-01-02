import { View, Text } from "react-native";
import { styles } from "@/assets/styles";
import Button from "@/components/button";
import React from "react";

//Page to request a ride
export default function Tab() {
  return (
    <View style={styles.container}>
      <Text style={styles.largeText}> Request a ride! </Text>
      <Button label="Confirm Ride" link="/pages-student/confirm" />
    </View>
  );
}
