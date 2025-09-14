import React, { useState, useRef } from "react";
import {
  View,
  Pressable,
  Text,
  TextInput,
  Keyboard,
  Alert,
  Dimensions,
  StyleSheet,
  PanResponder,
  Animated,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { driverFlagPopupStyles } from "assets/styles";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type FlaggingProps = {
  onFlag: (reason: string) => void;
  closePopUp: () => void;
};

export default function Flagging({ onFlag, closePopUp }: FlaggingProps) {
  const [description, setDescription] = useState("");
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT / 2)).current; // start in middle
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        let newY = translateY._value + gestureState.dy;
        newY = Math.max(MAX_TRANSLATE, Math.min(newY, SCREEN_HEIGHT));
        translateY.setValue(newY);
      },
      onPanResponderRelease: () => {
        const middle = SCREEN_HEIGHT / 2;
        const toValue = translateY._value > SCREEN_HEIGHT / 1.5 ? SCREEN_HEIGHT : middle;
        Animated.spring(translateY, { toValue, useNativeDriver: true, damping: 20 }).start(
          () => {
            if (toValue === SCREEN_HEIGHT) onCloseFlag();
          }
        );
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.sheet, { transform: [{ translateY }] }]}
      >
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
          <Pressable onPress={onCloseFlag} style={driverFlagPopupStyles.closeButton}>
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
    </View>
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
