// components/profile.tsx
import { Pressable, View, Text } from "react-native";

interface ProfileProps {
  isVisible: boolean;
  netid: string;
  onClose: () => void;
  onLogOut: () => void;
}

export default function Profile({
  isVisible,
  onClose,
  onLogOut,
  netid,
}: ProfileProps) {
  // TODO: fix this styling!!
  return isVisible ? (
    <View>
      <Pressable
        onPress={onClose}
        style={{ padding: 10, backgroundColor: "lightgray", borderRadius: 5 }}
      >
        <Text>Close Profile</Text>
      </Pressable>
      <Pressable
        onPress={onLogOut}
        style={{
          padding: 10,
          backgroundColor: "red",
          borderRadius: 5,
          marginTop: 10,
        }}
      >
        <Text style={{ color: "white" }}>Sign Out</Text>
      </Pressable>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>Profile</Text>
        <Text style={{ marginTop: 10 }}>NetID: {netid}</Text>
        {/* Add more profile details here */}
      </View>
    </View>
  ) : null;
}
