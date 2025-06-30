import { styles } from "@/assets/styles";
import {
  View,
  Image,
  useWindowDimensions,
  ImageSourcePropType,
} from "react-native";

interface OnboardingItemProps {
  item: {
    id: string;
    title: string;
    image: ImageSourcePropType;
  };
}

export default function OnboardingItem({ item }: OnboardingItemProps) {
  const { height, width } = useWindowDimensions();

  return (
    <View style={[styles.container, { width }]}>
      <Image
        source={item.image}
        style={{
          flex: 0.5,
          justifyContent: "center",
          height,
          resizeMode: "contain",
          marginTop: "-85%",
          alignSelf: "center",
        }}
      />
    </View>
  );
}
