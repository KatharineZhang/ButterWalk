/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import Feather from "@expo/vector-icons/Feather";

type LegendProps = {
  bottom: number;
};

export default function Legend({ bottom }: LegendProps) {
  const [width, setWidth] = React.useState(40);

  return (
    <View
      style={{
        position: "absolute",
        bottom: bottom,
        backgroundColor: "white",
        left: 10,
        borderRadius: 10,
        shadowOpacity: 0.5,
        width: width,
        height: 150,
        padding: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}>
        <Image
          source={require("@/assets/images/dropoff-location.png")}
          style={{
            height: 25,
            width: 20,
          }}
        />
        {width != 40 && (
          <Text style={{ fontSize: 12, marginLeft: 5 }}>Destination</Text>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center",marginBottom: 7 }}>
        <View
          style={{
            borderRadius: 13,
            backgroundColor: "#4B2E83",
            height: 20,
            width: 20,
          }}
        />
        {width != 40 && (
          <Text style={{ fontSize: 12, marginLeft: 5 }}>Pick Up Location</Text>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center",marginBottom: 7 }}>
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
        {width != 40 && (
          <Text style={{ fontSize: 12, marginLeft: 5 }}>Your Location</Text>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems:"center", alignContent: "center",
            marginBottom: 7
      }}>
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
        {width != 40 && (
          <Text style={{ fontSize: 12, marginLeft: 5 }}>Start Location</Text>
        )}
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
