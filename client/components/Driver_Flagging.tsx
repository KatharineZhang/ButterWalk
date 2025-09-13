import React, { useState } from "react";
import {
  View,
  Pressable,
  Text,
  TextInput,
  Keyboard,
  Alert,
  Dimensions,
  StyleSheet,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import {
  PanGestureHandler,
  GestureHandlerRootView,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { driverFlagPopupStyles } from "assets/styles";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type FlaggingProps = {
  onFlag: (reason: string) => void;
  closePopUp: () => void;
};

export default function Flagging({ onFlag, closePopUp }: FlaggingProps) {
  const [description, setDescription] = useState("");
  const translateY = useSharedValue(SCREEN_HEIGHT / 2); // start in the middle
  const MAX_TRANSLATE = 50; // top limit
  const MIN_TRANSLATE = SCREEN_HEIGHT; // bottom limit (dismiss)

  const onCloseFlag = () => {
    Keyboard.dismiss();
    closePopUp();
  };

  const onSubmit = () => {
    if (description.trim() === "") {
      Alert.alert("Error", "Please provide a description.");
      return;
    }
    onFlag(description);
    onCloseFlag();
  };

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateY.value = Math.max(MAX_TRANSLATE, ctx.startY + event.translationY);
    },
    onEnd: () => {
      if (translateY.value > SCREEN_HEIGHT / 1.5) {
        // dismissed
        runOnJS(onCloseFlag)();
      } else {
        // snap back to middle
        translateY.value = withSpring(SCREEN_HEIGHT / 2, { damping: 20 });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.sheet, animatedStyle]}>
          <View style={styles.dragHandle} />
          <View style={driverFlagPopupStyles.modalHeader}>
            <View style={driverFlagPopupStyles.headerTitleContainer}>
              <FontAwesome
                name="flag"
                size={20}
                color="#E53935"
                style={driverFlagPopupStyles.flagIcon}
              />
              <Text style={driverFlagPopupStyles.modalTitle}>Flag Student</Text>
            </View>
            <Pressable
              onPress={onCloseFlag}
              style={driverFlagPopupStyles.closeButton}
            >
              <FontAwesome name="times" size={22} color="#666" />
            </Pressable>
          </View>
          <Text style={driverFlagPopupStyles.descriptionLabel}>
            Provide a brief description:
          </Text>
          <TextInput
            style={driverFlagPopupStyles.textInput}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
          <Pressable onPress={onSubmit} style={driverFlagPopupStyles.submitButton}>
            <Text style={driverFlagPopupStyles.submitButtonText}>Submit</Text>
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dragHandle: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 10,
  },
});
