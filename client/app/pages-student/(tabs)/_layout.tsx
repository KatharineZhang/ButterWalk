import Header from "@/components/Header";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useLocalSearchParams } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import WebSocketService from "../../../types/WebSocketService";

//Each like subgroup of pages should have a _layout.tsx file, which specifies how our pages are organized

//TabLayout tells Expo that we want our app to have this tab layout (nav bar at the bottom)
export default function TabLayout() {
  const { netID } = useLocalSearchParams<{ netID?: string }>();
  WebSocketService.connect(netID as string); // Connect netid and websocket

  //Tabs.Screen is basically each of the little icons in the nav bar
  //Each Tabs.Screen tag has a name (title) of the page and some styling stuff (this was mostly default)
  //Also the name is also the path so /index would be the home page
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <Header netID={netID as string} />
      <Tabs screenOptions={{ tabBarActiveTintColor: "blue" }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="home" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            headerShown: false,
            title: "Map",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="map" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="faq"
          options={{
            headerShown: false,
            title: "FAQ",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="info" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            headerShown: false,
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="cog" color={color} />
            ),
          }}
        />
        {/* These are the extra pages once you press request ride (takes you to the request page, and then when you press confirm takes you to confirm page) */}
        {/* href: null just means they won't show up on the app navigation bar */}
        {/* Subject to change if we want to make this like its own little subgroup of pages */}

        <Tabs.Screen
          name="req"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="confirm"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
