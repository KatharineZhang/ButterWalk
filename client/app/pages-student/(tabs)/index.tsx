import { View, Text, StyleSheet } from "react-native";
import { styles } from "@/assets/styles";
import Button from "@/components/button";

//Page for request (wanted to rename it but when i did it had an error bc i think expo treats index.tsx as the home page)
export default function Tab() {
  return (
    <View style={styles.container}>
      <Text style={styles.largeText}> Home Page </Text>
      <Button label="Request a Ride" link="/pages-student/(tabs)/req" />
    </View>
  );
}
