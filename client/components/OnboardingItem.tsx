import { styles } from "@/assets/styles";
import { View, Text, Image, useWindowDimensions } from "react-native";

interface OnboardingItemProps {
  item: {
    id: string;
    title: string;
    image: any;
  };
}

export default function OnboardingItem({ item }: OnboardingItemProps) {
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.container, { width }]}>
      <Image
        source={item.image}
        style={{
          flex: 0.7,
          justifyContent: "center",
          width,
          resizeMode: "contain",
        }}
      />
      <View style={{ flex: 0.3, alignContent: "center", margin: 20 }}>
        <Text
          style={{
            fontSize: 28,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {item.title}
        </Text>
      </View>
    </View>
  );
}
