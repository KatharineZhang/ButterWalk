import { styles } from "@/assets/styles";
import WebSocketService from "@/services/WebSocketService";
import { useEffect, useState, useRef } from "react";
import {
  Text,
  ScrollView,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
} from "react-native";
import {
  WebSocketResponse,
  ChatMessageResponse,
} from "../../../server/src/api";
import { Timestamp } from "firebase/firestore";
import "@/assets/images/modal-close.png";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MessageProps {
  isVisible: boolean;
  onClose: () => void;
  userId: string;
}

function Message({ isVisible, onClose, userId }: MessageProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  // used to adjust input bar based on user's device
  const insets = useSafeAreaInsets();

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

  // Auto-scroll to bottom whenever a new message arrives or when the screen pops up
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isVisible]);

  // Send message via WebSocket
  const sendMessage = () => {
    if (input.trim()) {
      WebSocketService.send({
        directive: "CHAT_MESSAGE",
        senderID: userId,
        message: input,
        timestamp: Timestamp.now(),
        role: "DRIVER",
      });
      setInput("");
    }
  };

  // shows timestamps for messages that are 3 minutes apart
  function shouldShowTimestamp(
    prevMsg: ChatMessageResponse,
    currMsg: ChatMessageResponse
  ) {
    if (!prevMsg) return true;

    const prev = prevMsg.toReceiver.timestamp;
    const curr = currMsg.toReceiver.timestamp;

    // Convert to ms
    const prevMs = prev.seconds * 1000 + prev.nanoseconds / 1e6;
    const currMs = curr.seconds * 1000 + curr.nanoseconds / 1e6;

    const THREE_MIN = 3 * 60 * 1000; // 3 minutes in ms

    const timeClose = currMs - prevMs < THREE_MIN;
    return !timeClose;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      {/* View for chat icon at the top */}
      <View
        style={{
          position: "absolute",
          top: 67,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 100,
            width: 55,
            height: 55,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={45}
            color="#4B2E83"
            style={{ transform: [{ scaleX: -1 }] }}
          />
        </View>
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end", // align modal to bottom
        }}
      >
        <View style={styles.chatModalView}>
          <TouchableOpacity
            style={{ position: "absolute", top: "4%", left: "7%" }}
            onPress={onClose}
          >
            <Ionicons name="close-circle" size={45} color="#4B2E83" />
          </TouchableOpacity>

          {/* Header */}
          <View
            style={{
              alignItems: "center",
              marginBottom: "7%",
              marginTop: "11%",
            }}
          >
            <Text style={styles.faqHeader}>Messages</Text>
            <Text style={styles.faqSubtitle}>Contact your student</Text>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={insets.bottom * 2 + insets.bottom / 3}
            style={{ flex: 1 }}
          >
            {/* Scrollable message list */}
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={{
                paddingTop: "1%",
                paddingHorizontal: "5%",
                paddingBottom: "10%",
              }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Messages */}
              {messages.map((msg, idx) => {
                const isMine = msg.toReceiver.role === "DRIVER";
                const prevMsg = messages[idx - 1];
                const showTimestamp = shouldShowTimestamp(prevMsg, msg);

                return (
                  <View key={idx}>
                    {/* Timestamp Divider */}
                    {showTimestamp && (
                      <Text
                        style={{
                          alignSelf: "center",
                          color: "#7f7e7eff",
                          marginVertical: 10,
                          fontSize: 15,
                        }}
                      >
                        {(() => {
                          const ts = msg.toReceiver.timestamp;
                          const date = new Date(
                            ts.seconds * 1000 + ts.nanoseconds / 1e6
                          );

                          return date.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          });
                        })()}
                      </Text>
                    )}

                    {/* Message Bubble */}
                    <View
                      style={{
                        alignSelf: isMine ? "flex-end" : "flex-start",
                        backgroundColor: isMine ? "#4B2E83" : "#eee",
                        borderRadius: 18,
                        paddingVertical: "2%",
                        paddingHorizontal: "6%",
                        marginVertical: "1%",
                        maxWidth: "75%",
                      }}
                    >
                      <Text
                        style={{
                          color: isMine ? "white" : "black",
                          fontSize: 17,
                        }}
                      >
                        {msg.toReceiver.message}
                      </Text>
                    </View>
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
                borderColor: "#ddd",
                backgroundColor: "white",
                alignItems: "center",
                borderRadius: 50,
                marginBottom: "3%",
              }}
            >
              <TextInput
                value={input}
                onChangeText={setInput}
                onFocus={() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 25,
                  paddingVertical: "3%",
                  paddingHorizontal: "5%",
                  marginRight: "3%",
                  fontSize: 16,
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
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

export default Message;
