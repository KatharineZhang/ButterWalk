import { Stack } from "expo-router";

//This just specifies like our root layout (the largest overarching group of pages)
//Doesn't really matter rn i think because we just have one subgroup (tabs), but it was in the default so i kept it
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="index"
        options={{ headerTitle: "Husky ButterWalk" }}
      />
    </Stack>
  );
}
