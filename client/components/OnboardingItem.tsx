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
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.container, { width }]}>
      <Image
        source={item.image}
        style={{
          flex: 0.5,
          justifyContent: "center",
          width: width * (item.id === "2" ? 0.35 : item.id === "3" ? 0.4 : 0.7),
          resizeMode: "contain",
          marginTop: -350,
          alignSelf: "center",
        }}
      />
      {/*<View style={{ flex: 0.3, alignContent: "center", margin: 20 }}>
        <Text
          style={{
            fontSize: 28,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {item.title}
        </Text>
        </View> */}
    </View>
  );
}
