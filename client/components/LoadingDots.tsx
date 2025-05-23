/** ALL CREDIT GOES TO https://github.com/alexvcasillas/react-native-loading-dots/blob/master/src/react-native-loading-dots.js
 * THIS CODE IS ALL FROM THE ABOVE LINK WITH SLIGHT MODIFICATIONS
 * THIS PACKAGE COULD NOT BE IMPORTED DUE TO DEPENDENCY ISSUES SO CODE WAS COPIED. WE TAKE NO CREDIT FOR THIS CODE
 */

import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Animated, Easing } from "react-native";

const defaultColors = ["white", "white", "white"];

/**
 * React Component that creates a smooth loading animation with dots
 * or custom components
 * @param {number} dots
 * @param {string[]} colors
 * @param {number} size
 * @param {number} bounceHeight
 * @param {number} borderRadius
 * @param {React.ReactNode[]} components
 * @returns React.JSX.Element
 */
type LoadingDotsProps = {
  dots?: number;
  colors?: string[];
  size?: number;
  bounceHeight?: number;
  borderRadius?: number;
  components?: React.ReactNode[] | null;
};

function LoadingDots({
  dots = 3,
  colors = defaultColors,
  size = 20,
  bounceHeight = 20,
  borderRadius,
  components = null,
}: LoadingDotsProps): React.JSX.Element {
  const [animations, setAnimations] = useState<Animated.Value[]>([]);
  const reverse = useRef(false);

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dotAnimations = [];
    const animationsAmount =
      !!components && Array.isArray(components) ? components.length : dots;
    for (let i = 0; i < animationsAmount; i++) {
      dotAnimations.push(new Animated.Value(0));
    }
    setAnimations(dotAnimations);
  }, []);

  useEffect(() => {
    if (animations.length === 0) return;
    loadingAnimation(animations, reverse.current);
    appearAnimation();
  }, [animations]);

  function appearAnimation() {
    Animated.timing(opacity, {
      toValue: 1,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }

  function floatAnimation(
    node: Animated.Value,
    reverseY: boolean,
    delay: number
  ) {
    const floatSequence = Animated.sequence([
      Animated.timing(node, {
        toValue: reverseY ? bounceHeight : -bounceHeight,
        easing: Easing.bezier(0.41, -0.15, 0.56, 1.21),
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(node, {
        toValue: reverseY ? -bounceHeight : bounceHeight,
        easing: Easing.bezier(0.41, -0.15, 0.56, 1.21),
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(node, {
        toValue: 0,
        delay,
        useNativeDriver: true,
      }),
    ]);
    return floatSequence;
  }

  function loadingAnimation(nodes: Animated.Value[], reverseY: boolean) {
    Animated.parallel(
      nodes.map((node, index) => floatAnimation(node, reverseY, index * 100))
    ).start(() => {
      reverse.current = !reverse.current;
    });
  }

  useEffect(() => {
    if (animations.length === 0) return;
    loadingAnimation(animations, reverse.current);
  }, [reverse, animations]);

  return (
    <Animated.View style={[styles.loading, { opacity }]}>
      {animations.map((animation, index) =>
        components ? (
          <Animated.View
            key={`loading-anim-${index}`}
            style={[{ transform: [{ translateY: animation }] }]}
          >
            {components[index]}
          </Animated.View>
        ) : (
          <Animated.View
            key={`loading-anim-${index}`}
            style={[
              {
                width: size,
                height: size,
                borderRadius: borderRadius || size / 2,
              },
              { backgroundColor: colors[index] || "#4dabf7" },
              { transform: [{ translateY: animation }] },
            ]}
          />
        )
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loading: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export default LoadingDots;
