import { Pressable, Text, Linking } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

interface DirectionsProps {
  locationTo: {
    latitude: number;
    longitude: number;
  };
  role: "STUDENT" | "DRIVER";
}

export default function DirectionsButton({
  locationTo,
  role,
}: DirectionsProps) {
  // Function to open Google Maps with directions while app still runs in background
  const openGoogleMapsDirections = async (destination: {
    latitude: number;
    longitude: number;
  }) => {
    const mode = role == "STUDENT" ? "walking" : "driving";
    try {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=${mode}`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error("Cannot open maps URL");
      }
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <Pressable
      style={{
        backgroundColor: "#F5F5F5",
        borderColor: "#6B4FA3",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }}
      onPress={() => {
        openGoogleMapsDirections(locationTo);
      }}
    >
      <FontAwesome5 name="directions" size={20} color="#4B2E83" />
      <Text
        style={{
          color: "#4B2E83",
          fontSize: 14,
          fontWeight: "600",
          marginLeft: 8,
        }}
      >
        Directions
      </Text>
    </Pressable>
  );
}
