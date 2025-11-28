import {
  View,
  Text,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useEffect, useState } from "react";
import { Link, Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import Ionicons from "@expo/vector-icons/Ionicons";

import WebSocketService, {
  WebsocketConnectMessage,
} from "@/services/WebSocketService";
import { WebSocketResponse, ErrorResponse } from "../../../server/src/api";

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const [driverId, setDriverId] = useState<string>("");
  const [signedIn, setSignedIn] = useState<boolean | null>(false);
  const [errMsg, setErrMsg] = useState("");
  const [netid, setNetid] = useState("");

  useEffect(() => {
    const connectWebSocket = async () => {
      // call our new route
      const msg: WebsocketConnectMessage = await WebSocketService.connect()
        .then((msg) => msg)
        .catch((err) => err);
      if (msg !== "Connected Successfully") {
        console.log(
          "WEBSOCKET: Failed to connect to WebSocket in Driver SignIn"
        );
      }
    };
    connectWebSocket();
    WebSocketService.addListener(handleSigninMessage, "SIGNIN");
  }, []);

  const checkDriverIdInput = () => {
    if (/^[a-z0-9]+$/.test(driverId.toLowerCase())) {
      setNetid(driverId.toLowerCase());
      setErrMsg("");
      WebSocketService.send({
        directive: "SIGNIN",
        response: null,
        role: "DRIVER",
        netid: driverId.toLowerCase(),
      });
    } else {
      setDriverId("");
      setErrMsg("Driver ID must have only lowercase letters or numbers.");
    }
  };

  const handleSigninMessage = (message: WebSocketResponse) => {
    if ("response" in message && message.response == "SIGNIN") {
      setSignedIn(true);
    } else {
      const errorResp = message as ErrorResponse;
      setErrMsg(errorResp.error);
      setSignedIn(false);
    }
  };

  return signedIn && netid ? (
    <Redirect
      href={{
        pathname: "/(driver)/home",
        params: { netid: netid },
      }}
    />
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 40,
          backgroundColor: "#fff",
        }}
        // behavior="padding"
      >
        <View style={{ position: "absolute", top: "5%", left: "5%" }}>
          <Link href="/driverOrstudent" asChild>
            <Pressable>
              <Ionicons name="arrow-back" size={40} color="#4B2E83" />
            </Pressable>
          </Link>
        </View>
        <Text
          style={{
            fontSize: 30,
            fontWeight: "700",
            color: "#4B2E83",
            textAlign: "left",
          }}
        >
          Driver’s Log In
        </Text>

        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: "#555",
            textAlign: "left",
          }}
        >
          Start your shift by entering your UWPD Driver ID.
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 12,
            paddingHorizontal: 12,
            marginTop: 30,
            width: "100%",
            height: 70,
          }}
        >
          <Ionicons name="person-outline" size={20} color="#7D5BA6" />
          <TextInput
            value={driverId}
            style={{
              flex: 1,
              marginLeft: 8,
              height: 60,
              fontSize: 16,
              color: "#000",
            }}
            placeholder="Enter Your Driver ID"
            placeholderTextColor="#808080"
            onChangeText={setDriverId}
            autoCapitalize="none"
          />
        </View>

        {errMsg ? (
          <Text style={{ marginTop: 10, color: "red", fontSize: 13 }}>
            {errMsg}
          </Text>
        ) : null}

        <Pressable
          style={{
            backgroundColor: driverId.length > 0 ? "#4B2E83" : "gray",
            borderRadius: 16,
            marginTop: 280,
            width: "100%",
            height: 70,
            justifyContent: "center",
            alignItems: "center",
          }}
          disabled={!driverId.length}
          onPress={checkDriverIdInput}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
            Log In
          </Text>
        </Pressable>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Login;
