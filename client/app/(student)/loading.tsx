import { View, Text, Pressable } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { styles } from "@/assets/styles";

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
