import {
  View,
  Text,
  KeyboardAvoidingView,
  Pressable,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from "react-native";
import { useEffect, useState } from "react";
import { styles } from "../../assets/styles";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// @ts-expect-error the image does exists so get rid of the error
import butterWalkLogo from "@/assets/images/butterWalkLogo.png";
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

  // on render,
  // connect to websocket and send the response to backend when we get it
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
      // if nothing is logged, assumed connected successfully
    };
    connectWebSocket();
    WebSocketService.addListener(handleSigninMessage, "SIGNIN");
  }, []);

  // check that the driver ID input is correct
  // param: input - the driver id input in the sign in
  const checkDriverIdInput = () => {
    if (/^[a-z]{5,7}$/.test(driverId.toLowerCase())) {
      setNetid(driverId.toLowerCase());
      setErrMsg("");
      // send the signin request to the backend
      WebSocketService.send({
        directive: "SIGNIN",
        response: null,
        role: "DRIVER",
        netid: driverId.toLowerCase(),
      });
    } else {
      setDriverId("");
      setErrMsg("Driver ID must be 5 to 7 lowercase letters.");
    }
  };

  const handleSigninMessage = (message: WebSocketResponse) => {
    if ("response" in message && message.response == "SIGNIN") {
      setSignedIn(true);
    } else {
      // there was a signin related error
      const errorResp = message as ErrorResponse;
      setErrMsg(errorResp.error);
      setSignedIn(false);
    }
  };

  // if signed in successfully, redirect
  return signedIn && netid ? (
    <Redirect
      href={{
        pathname: "/(driver)/home",
        params: {
          netid: netid,
        },
      }}
    />
  ) : (
    <View
      style={[
        styles.container,
        {
          margin: "10%",
          alignItems: "center",
        },
      ]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
          <Text style={styles.appNameText}>Husky ButterWalk</Text>
          <Image style={styles.signinLogo} source={butterWalkLogo} />
          <Text style={styles.signInText}>Driver Sign In</Text>
          <View style={{ height: "7%" }}></View>

          <Text style={{ fontSize: 17, fontWeight: "500" }}>Driver Netid</Text>
          {errMsg && (
            <Text style={{ wordWrap: "true", maxWidth: "70%", color: "red" }}>
              {errMsg}
            </Text>
          )}

          <TextInput
            value={driverId}
            style={[
              styles.input,
              driverId && styles.inputFocused,
              {
                alignSelf: "center",
                width: Dimensions.get("window").width * 0.9,
                marginBottom: "5%",
              },
            ]}
            placeholderTextColor={"#808080"}
            onChangeText={(text: string) => setDriverId(text)}
            autoCapitalize="none"
          />

          <Pressable
            style={styles.signInButton}
            onPress={() => {
              checkDriverIdInput();
            }}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Login;