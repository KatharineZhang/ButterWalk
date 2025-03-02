import { styles } from "@/assets/styles";
import {
  View,
  Text,
  Image,
  useWindowDimensions,
  ImageSourcePropType,
} from "react-native";

interface OnboardingItemProps {
  item: {
    id: string;
    color: string;
    image: ImageSourcePropType;
  };
}

export default function OnboardingItem({ item }: OnboardingItemProps) {
  const { width } = useWindowDimensions();
  return (
    <View
      style={[styles.container, { width }, { backgroundColor: item.color }]}
    >
      <Image
        source={item.image}
        style={{
          flex: 0.4,
          justifyContent: "center",
          marginBottom: "70%",
          width,
          resizeMode: "contain",
        }}
      />
    </View>
  );
}
