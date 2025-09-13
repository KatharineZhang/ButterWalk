import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useMemo,
} from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Modal from "react-native-modal";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

interface BottomDrawerProps {
  children: React.ReactNode;
}

export interface BottomDrawerRef {
  open: () => void;
  close: () => void;
  expand: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const BottomDrawer = forwardRef<BottomDrawerRef, BottomDrawerProps>(
  ({ children }, ref) => {
    const snapPoints = useMemo(() => [0.4 * SCREEN_HEIGHT, 0.89 * SCREEN_HEIGHT], []);
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const isVisible = useSharedValue(false);

    // Expose functions to parent
    useImperativeHandle(ref, () => ({
      open: () => {
        isVisible.value = true;
        translateY.value = withSpring(snapPoints[0], { damping: 20 });
      },
      close: () => {
        translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20 }, () => {
          runOnJS(() => (isVisible.value = false))();
        });
      },
      expand: () => {
        translateY.value = withSpring(snapPoints[1], { damping: 20 });
      },
    }));

    const gestureHandler = (event: PanGestureHandlerGestureEvent) => {
      const dragY = event.nativeEvent.translationY;
      translateY.value = dragY > 0 ? dragY : 0;
    };

    const gestureEndHandler = (event: PanGestureHandlerGestureEvent) => {
      const dragY = event.nativeEvent.translationY;
      if (dragY > snapPoints[0]) {
        // If dragged down past first snap, close
        runOnJS(() => {
          translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20 });
          isVisible.value = false;
        })();
      } else if (dragY > snapPoints[1] - snapPoints[0]) {
        // If dragged between snap points, snap to first
        translateY.value = withSpring(snapPoints[0], { damping: 20 });
      } else {
        // Else snap to expanded
        translateY.value = withSpring(snapPoints[1], { damping: 20 });
      }
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    return (
      <Modal
        isVisible={isVisible.value}
        backdropTransitionOutTiming={0}
        onBackdropPress={() => {
          translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20 }, () => {
            runOnJS(() => (isVisible.value = false))();
          });
        }}
        style={styles.modal}
        propagateSwipe
      >
        <PanGestureHandler
          onGestureEvent={gestureHandler}
          onEnded={gestureEndHandler}
        >
          <Animated.View style={[styles.container, animatedStyle]}>
            <View style={styles.handle} />
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </PanGestureHandler>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
});

export default BottomDrawer;
