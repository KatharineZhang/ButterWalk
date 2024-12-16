import { styles } from "@/assets/styles";
import { View, Animated, useWindowDimensions } from "react-native";

interface PaginatorProps {
  data: Array<{
    id: string;
    title: string;
    image: any;
  }>;
  scrollX: any;
}
export default function Paginator({ data, scrollX }: PaginatorProps) {
  const { width } = useWindowDimensions();
  return (
    <View style={{ flexDirection: "row", height: 50, alignItems: "center" }}>
      {data.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ]; // prev, curr, next dots
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 35, 10], //prev, (bigger) curr, next dots
          extrapolate: "clamp",
        });
        const opacity = scrollX.interpolate({
          //fade out the dots when they are not the current dot
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            style={[styles.paginatorDot, { width: dotWidth, opacity }]}
            key={index.toString()}
          />
        );
      })}
    </View>
  );
}
