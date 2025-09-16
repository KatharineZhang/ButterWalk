import {
  WebSocketResponse,
  ErrorResponse,
  StudentSignInResponse,
} from "../../../server/src/api";
import WebSocketService, {
  WebsocketConnectMessage,
} from "../../services/WebSocketService";

import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect } from "react";

const FinishSignIn = () => {
  const [accExists, setAccExists] = useState<boolean | null>(null);
  const [netid, setNetid] = useState("");
  // JSONified response object from signin.tsx (from Google)
  const { serializedResponse } = useLocalSearchParams();
  const [response, setResponse] = useState(null);

  useEffect(() => {
    if (serializedResponse) {
      const finalSerializedResponse = Array.isArray(serializedResponse)
        ? serializedResponse[0]
        : serializedResponse;
      try {
        const decodedResponse = decodeURIComponent(finalSerializedResponse);
        const parsedResponse = JSON.parse(decodedResponse);
        setResponse(parsedResponse);
      } catch (error) {
        console.log("Failed to parse serialized response:", error);
      }
    }
  }, [serializedResponse]);

  useEffect(() => {
    if (!response) {
      return;
    }
    
    const handleSigninMessage = (message: WebSocketResponse) => {
      if ("response" in message && message.response === "SIGNIN") {
        const signinResp = message as StudentSignInResponse;
        if (signinResp.alreadyExists) {
          setAccExists(true);
        } else {
          setAccExists(false);
        }
        setNetid(signinResp.netid);
      } else {
        const errorResp = message as ErrorResponse;
        console.log("Signin related error:", errorResp.error);
        router.replace({pathname: "/(student)/signin", params: {error: errorResp.error} });
      }
    };

    WebSocketService.addListener(handleSigninMessage, "SIGNIN");

    const connectWebSocket = async () => {
      const msg: WebsocketConnectMessage = await WebSocketService.connect()
        .then((msg) => msg)
        .catch((err) => err);
      if (msg === "Connected Successfully") {
        WebSocketService.send({
          directive: "SIGNIN",
          response,
          role: "STUDENT",
        });
      } else {
        console.log(
          "WEBSOCKET: Failed to connect to WebSocket in FinishSignIn"
        );
      }
    };
    
    connectWebSocket();
    
    return () => {
      WebSocketService.removeListener(handleSigninMessage, "SIGNIN");
    };
  }, [response]);

  // Using dedicated useEffect to handle navigation (finishAcc.tsx or home.tsx)
  useEffect(() => {
    if (accExists === true && netid) {
      router.replace({
        pathname: "/(student)/home",
        params: { netid: netid },
      });
    } else if (accExists === false && netid) {
      router.replace({
        pathname: "/(student)/finishAcc",
        params: { netid: netid },
      });
    }
  }, [accExists, netid]);

  // Loading page for a couple of seconds while the app logs the user in,
  // (UI for loading page is below)
  return (
    LoadingPage()
  );
};
export default FinishSignIn;

import { View, Text, Animated, Easing } from "react-native";
import { Stack } from "expo-router";
import { useRef } from "react";

const LoadingPage = () => {
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
