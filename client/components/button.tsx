import { View, Pressable, Text } from "react-native";
import { styles } from "../assets/styles";
import React from "react";
import { Link } from "expo-router";
import { Href } from "expo-router";

interface ButtonProps {
  label: string;
  link: Href;
}

//A button component that takes in a label (name) and a link to wherever we want to go
const Button: React.FC<ButtonProps> = ({ label, link }) => {
  return (
    <View style={styles.buttonContainer}>
      <Link href={link} asChild>
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
            {label}
          </Text>
        </Pressable>
      </Link>
    </View>
  );
};

export default Button;
