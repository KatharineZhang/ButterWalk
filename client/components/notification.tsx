import { View, Pressable, Text } from "react-native";
import { styles } from "../assets/styles";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface NotificationProps {
    text: string;
    color: string;
    boldText?: string;
}
  
const Notification: React.FC<NotificationProps> = ({ text, color, boldText }) => {
    const [isVisible, setIsVisible] = useState(true);

    const closeNotification = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;
    return (
        <View style={[styles.notificationContainer, { backgroundColor: color }]}>
            <Ionicons name="checkmark" size={16} color="black" />
            <Text style={styles.notificationText}>
                {boldText ? (
                    <>
                        {text.split(boldText)[0]}
                        <Text style={{ fontWeight: 'bold' }}>{boldText}</Text>
                        {text.split(boldText)[1]}
                    </>
                ) : (
                    text
                )}
            </Text>
            <Pressable onPress={closeNotification}>
                <Ionicons name="close" size={16} color="black" />
            </Pressable>
        </View>
    );
};

export default Notification;