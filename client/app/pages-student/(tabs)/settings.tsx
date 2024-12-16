import React from "react";
import { View, Text, StyleSheet } from "react-native";

//Page for settings
export default function Tab() {
  return (
    <View style={styles.container}>
      <Text style={styles.largeText}>Settings</Text>
    </View>
  );
}

//IK THIS IS PROBABLY HORRIBLE STYLE BUT I WAS TOO LAZY TO MAKE A CSS FILE SO I JUST COPY PASTED IT
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  largeText: {
    fontSize: 25,
  },
});
