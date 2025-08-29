import { View, Text, Animated, Easing } from "react-native";
import { Stack } from "expo-router";
import { useEffect, useRef } from "react";

const Loading = () => {
  // Persist animated values across renders
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: -10, // jump height
            duration: 300,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(delay),
        ])
      );
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 100);
    const anim3 = createAnimation(dot3, 200);

    anim1.start();
    anim2.start();
    anim3.start();

    // cleanup
    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Text
        style={{
          fontSize: 30,
          color: "#4B2E83",
          marginBottom: 20,
        }}
      >
        Loading!
      </Text>

      {/* Animated Dots */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginVertical: 20,
        }}
      >
        {[dot1, dot2, dot3].map((dot, index) => (
          <Animated.View
            key={index}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#4B2E83",
              marginHorizontal: 5,
              transform: [{ translateY: dot }],
            }}
          />
        ))}
      </View>

      <Text
        style={{
          fontSize: 20,
          textAlign: "center",
          lineHeight: 30,
          marginVertical: 20,
          marginHorizontal: 30,
        }}
      >
        Please wait as we redirect you to the next page...
      </Text>
    </View>
  );
};

export default Loading;
