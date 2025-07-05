import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

interface Props {
  onLogout: () => void;
}

export default function LogoutWarning({ onLogout }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your shift has ended.</Text>
      <Text style={styles.message}>
        Please log out. You won’t receive any new ride requests.
      </Text>
      <Button title="Log Out" onPress={onLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    padding: 16,
    margin: 16,
    backgroundColor: "#ffe4e1",
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    marginBottom: 12,
  },
});
