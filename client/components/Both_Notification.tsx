import { Pressable, Text, Animated } from "react-native";
import { styles } from "../assets/styles";
import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

interface NotificationProps {
  text: string;
  color: string;
  boldText?: string;
}

export type NotificationType = {
  text: string;
  color: string;
  boldText?: string;
};

const Notification: React.FC<NotificationProps> = ({
  text,
  color,
  boldText,
}) => {
  const top = useRef(new Animated.Value(-1000)).current;

  useEffect(() => {
    Animated.timing(top, {
      toValue: 50,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Close notification after 20 seconds
    const timer = setTimeout(() => {
      closeNotification();
    }, 5000);
    return () => clearTimeout(timer);
  }, [text]);

  const closeNotification = () => {
    Animated.timing(top, {
      toValue: -1000,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        { zIndex: 100, top: top, backgroundColor: color },
      ]}
    >
      <Ionicons name="checkmark" size={16} color="black" />
      <Text style={styles.notificationText}>
        {boldText ? (
          <>
            {text.split(boldText)[0]}
            <Text style={{ fontWeight: "bold" }}>{boldText}</Text>
            {text.split(boldText)[1]}
          </>
        ) : (
          text
        )}
      </Text>
      <Pressable onPress={closeNotification}>
        <Ionicons name="close" size={16} color="black" />
      </Pressable>
    </Animated.View>
  );
};
export default Notification;
