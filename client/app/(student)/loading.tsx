import { View, Text } from "react-native";
import { Stack } from "expo-router";

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
        <Text>Loading...</Text>
      </View>
    </>
  );
}
