import React, { forwardRef, useImperativeHandle, useState, useRef } from "react";
import { View, StyleSheet, Dimensions, PanResponder, Animated } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomDrawerProps {
  children: React.ReactNode;
  initialVisible?: boolean;
}

export interface BottomDrawerRef {
  open: () => void;
  close: () => void;
}

const BottomDrawer = forwardRef<BottomDrawerRef, BottomDrawerProps>(
  ({ children, initialVisible = true }, ref) => {
    const [visible, setVisible] = useState(initialVisible);

    const snap40 = 0.4 * SCREEN_HEIGHT;
    const snap70 = 0.85 * SCREEN_HEIGHT;

    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT - snap40)).current;

    useImperativeHandle(ref, () => ({
      open: () => {
        setVisible(true);
        Animated.spring(translateY, {
          toValue: SCREEN_HEIGHT - snap40,
          useNativeDriver: true,
        }).start();
      },
      close: () => {
        Animated.spring(translateY, {
          toValue: SCREEN_HEIGHT,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      },
    }));

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          let newY = translateY._value + gestureState.dy;
          newY = Math.min(Math.max(newY, SCREEN_HEIGHT - snap70), SCREEN_HEIGHT);
          translateY.setValue(newY);
        },
        onPanResponderRelease: (_, gestureState) => {
          const middle = SCREEN_HEIGHT - (snap40 + snap70) / 2;
          const toValue =
            translateY._value > middle ? SCREEN_HEIGHT - snap40 : SCREEN_HEIGHT - snap70;
          Animated.spring(translateY, { toValue, useNativeDriver: true }).start();
        },
      })
    ).current;

    if (!visible) return null;

    return (
      <View style={styles.gestureContainer}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.drawer, { transform: [{ translateY }] }]}
        >
          <View style={styles.handle} />
          <View style={{ flex: 1 }}>{children}</View>
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  gestureContainer: {
    flex: 1,
    position: "absolute",
    width: "100%",
    height: SCREEN_HEIGHT,
    bottom: 0,
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: SCREEN_HEIGHT,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    overflow: "hidden",
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 10,
  },
});

export default BottomDrawer;
