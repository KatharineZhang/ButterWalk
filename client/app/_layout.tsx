import React from "react";
import { Stack } from "expo-router";
import { Text } from "react-native";
import * as Sentry from "sentry-expo";

Sentry.init({
  dsn: 'https://16af6dee84f28f5b28487764feb725a6@o4509688035016704.ingest.us.sentry.io/4509688215896064',
  enableInExpoDevelopment: true,
  debug: true,
});

export default function RootLayout() {
  return (
    <Sentry.React.ErrorBoundary fallback={<Text>Something went wrong.</Text>}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerTitle: "Husky ButterWalk", headerShown: false }}
        />
        <Stack.Screen
          name="driverOrstudent"
          options={{ headerTitle: "Husky ButterWalk", headerShown: false }}
        />
        <Stack.Screen
          name="(driver)"
          options={{ headerTitle: "UW Driver", headerShown: false }}
        />
        <Stack.Screen
          name="(student)"
          options={{ headerTitle: "UW Student", headerShown: false }}
        />
      </Stack>
    </Sentry.React.ErrorBoundary>
  );
}
