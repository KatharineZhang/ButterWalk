import { Stack } from "expo-router";

//This just specifies like our root layout (the largest overarching group of pages)
//Doesn't really matter rn i think because we just have one subgroup (tabs), but it was in the default so i kept it
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="signin"
        options={{ headerTitle: "signin", headerShown: false }}
      />
      <Stack.Screen
        name="map"
        options={{ headerTitle: "Map", headerShown: false }}
      />
      <Stack.Screen
        name="faq"
        options={{
          headerTitle: "faq",
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
        }}
      />
    </Stack>
  );
}
