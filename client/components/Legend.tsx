import React from "react";
import { View, Text, Pressable } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { FontAwesome6 } from "@expo/vector-icons";
import { styles } from "@/assets/styles";

export default function Legend() {
  const [width, setWidth] = React.useState(40);

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 10,
        shadowOpacity: 0.5,
        width: width,
        padding: 10,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}
      >
        <FontAwesome6 name="location-dot" size={24} color="#d02323" />
        {width != 40 && <Text style={styles.legendText}>Destination</Text>}
      </View>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}
      >
        <View
          style={{
            borderRadius: 13,
            backgroundColor: "#4B2E83",
            height: 20,
            width: 20,
          }}
        />
        {width != 40 && <Text style={styles.legendText}>Pick Up Location</Text>}
      </View>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}
      >
        <View
          style={{
            borderRadius: 13,
            backgroundColor: "#C5B4E3",
            height: 20,
            width: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              borderRadius: 13,
              backgroundColor: "#4B2E83",
              height: 8,
              width: 8,
            }}
          />
        </View>
        {width != 40 && <Text style={styles.legendText}>Your Location</Text>}
      </View>
      <View style={styles.legendContainer}>
        <View
          style={{
            borderRadius: 13,
            backgroundColor: "white",
            borderColor: "black",
            borderWidth: 1,
            height: 20,
            width: 20,
          }}
        />
        {width != 40 && <Text style={styles.legendText}>Start Location</Text>}
      </View>
      <Pressable onPress={() => setWidth(width === 40 ? 150 : 40)}>
        {width == 40 ? (
          <Feather style={{ width: 40 }} name="chevrons-right" size={20} />
        ) : (
          <Feather style={{ width: 40 }} name="chevrons-left" size={20} />
        )}
      </Pressable>
    </View>
  );
}
