import React from "react";
import { styles } from "@/assets/styles";
import {
  View,
  Animated,
  useWindowDimensions,
  ImageSourcePropType,
} from "react-native";

interface PaginatorProps {
  data: Array<{
    id: string;
    title: string;
    image: ImageSourcePropType;
  }>;
  scrollX: Animated.Value;
}

export default function Paginator({ data, scrollX }: PaginatorProps) {
  const { width } = useWindowDimensions();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", bottom: -10 }}>
      {data.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];
        const dotSize = scrollX.interpolate({
          inputRange,
          outputRange: [8, 20, 8], // prev, curr, next
          extrapolate: "clamp",
        });
        const opacity = scrollX.interpolate({
          //fade out the dots when they are not the current dot
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });
        const backgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: ["#333", "#4B2E83", "#333"],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            style={[
              styles.paginatorDot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: 50,
                opacity,
                backgroundColor,
                marginHorizontal: 8,
              },
            ]}
            key={index.toString()}
          />
        );
      })}
    </View>
  );
}
