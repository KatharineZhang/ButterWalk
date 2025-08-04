import { View, Pressable, Text } from "react-native";
import { styles } from "../assets/styles";
import React from "react";
import { Link } from "expo-router";
import { Href } from "expo-router";

interface ButtonProps {
  label: string;
  link: Href<string | object>;
}

//A button component that takes in a label (name) and a link to wherever we want to go
const Button: React.FC<ButtonProps> = ({ label, link }) => {
  return (
    <View style={styles.buttonContainer}>
      <Link href={link} asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonLabel}>{label}</Text>
        </Pressable>
      </Link>
    </View>
  );
};

export default Button;
