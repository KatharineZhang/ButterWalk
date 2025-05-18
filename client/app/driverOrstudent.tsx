import Button from "@/components/button";
import { View, Text } from "react-native";

export default function driverOrstudent() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          textAlign: "center",
          fontWeight: "500",
          color: "#4B2E83",
        }}
      >
        To start, are you a UW Student or a UWPD Driver?
      </Text>
      <View style={{ height: 20 }} />
      <Button label="I'm a UWPD Driver" link="/(driver)/signin" />
      <Button label="I'm a UW Student" link="/(student)/signin" />
    </View>
  );
}

//
