import { styles } from "@/assets/styles";
import PopUpModal from "@/components/Student_PopUpModal";
import WebSocketService from "@/services/WebSocketService";
import { JSX, useEffect, useState, useRef } from "react";
import {
  Text,
  ScrollView,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  WebSocketResponse,
  ChatMessageResponse,
} from "../../server/src/api";

interface MessageProps {
  isVisible: boolean;
  onClose: () => void;
  studentId: string;
  driverId: string;
  role: "STUDENT" | "DRIVER";
}

function Message({ isVisible, onClose, studentId, driverId, role }: MessageProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Set up WebSocket listener on mount
  useEffect(() => {
    const handleChatMessage = (message: WebSocketResponse) => {
      if ("response" in message && message.response === "CHAT_MESSAGE") {
        const chatMsg = message as ChatMessageResponse;
        setMessages((prev) => [...prev, chatMsg]);
      }
    };

    WebSocketService.addListener(handleChatMessage, "CHAT_MESSAGE");
    return () => {
      WebSocketService.removeListener(handleChatMessage, "CHAT_MESSAGE");
    };
  }, []);

  // Auto-scroll to bottom whenever a new message arrives
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Send message via WebSocket
  const sendMessage = () => {
    if (input.trim()) {
      WebSocketService.send({
        directive: "CHAT_MESSAGE",
        studentId,
        driverId,
        role,
        text: input,
      });
      setInput("");
    }
  };

const messageUI: JSX.Element = (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    // the amount of space between the keyboard and text input space
    keyboardVerticalOffset={Platform.OS === "ios" ? 165 : 30} 
    >
      <View style={{ flex: 1 }}>
      {/* Scrollable message list + header */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            paddingTop: "1%",
            paddingHorizontal: "5%",
          paddingBottom: "20%",
          }}
        keyboardShouldPersistTaps="handled" //
        >
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: "3%" }}>
            <Text style={styles.faqHeader}>Messages</Text>
            <Text style={styles.faqSubtitle}>
              Contact your {role === "STUDENT" ? "driver" : "student"}
            </Text>
          </View>

          {/* Messages */}
          {messages.map((msg, idx) => {
            const isMine = msg.role === role;
            return (
              <View
                key={idx}
                style={{
                  alignSelf: isMine ? "flex-end" : "flex-start",
                  backgroundColor: isMine ? "#4B2E83" : "#eee",
                  borderRadius: 18,
                  paddingVertical: "2%",
                  paddingHorizontal: "4%",
                  marginVertical: "1%",
                  maxWidth: "75%",
                }}
              >
              <Text style={{ color: isMine ? "white" : "black" }}>
                {msg.text}
              </Text>
              </View>
            );
          })}
        </ScrollView>

      {/* Input area fixed at bottom */}
          <View
            style={{
              flexDirection: "row",
          paddingVertical: "2.5%",
          paddingHorizontal: "4%",
          borderTopWidth: 1,
              borderColor: "#ddd",
          backgroundColor: "white",
          alignItems: "center",
          borderRadius: 50,
          marginHorizontal: "1%",
          marginBottom: Platform.OS === "ios" ? "3%" : "1%",
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              style={{
                flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 25,
            paddingVertical: "2%",
            paddingHorizontal: "4%",
            marginRight: "3%",
            fontSize: 16
          }}
            />
            <Pressable
          onPress={sendMessage}
              style={{
                backgroundColor: "#4B2E83",
            borderRadius: 25,
            paddingVertical: "3%",
            paddingHorizontal: "7%",
                alignItems: "center",
            justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 16 }}>Send</Text>
            </Pressable>
          </View>
        </View>
    </KeyboardAvoidingView>
);

  return (
    <PopUpModal
      isVisible={isVisible}
      onClose={onClose}
      type="full"
      content={messageUI}
    />
  );
}

export default Message;
