import { styles } from "@/assets/styles";
import { Link } from "expo-router";
import { View, Text, Pressable } from "react-native";

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
      <View style={styles.buttonContainer}>
        <Link href={"/(driver)/signin"} asChild>
          <Pressable
            style={{
              borderColor: "#4B2E83",
              borderWidth: 2,
              width: "100%",
              height: 50,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#4B2E83", fontSize: 20, fontWeight: "400" }}>
              I'm a UWPD Driver
            </Text>
          </Pressable>
        </Link>
      </View>
      <View style={styles.buttonContainer}>
        <Link href={"/(student)/signin"} asChild>
          <Pressable
            style={{
              borderColor: "#4B2E83",
              borderWidth: 2,
              width: "100%",
              height: 50,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#4B2E83", fontSize: 20, fontWeight: "400" }}>
              I'm a UW Student{" "}
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

//
