import { View, Text, } from "react-native";
import { Stack } from "expo-router";

// currently not in use due to bugs
export default function LoadingPage() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          backgroundColor: "tan",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ marginBottom: 20 }}>Loading...</Text>
      </View>
    </>
  );
}
