import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Pressable,
  TouchableOpacity,
  Image,
} from "react-native";
import { useState, useEffect } from "react";
import { styles } from "@/assets/styles";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
// need to 'npx expo install expo-web-browser expo-auth-session expo-crypto'
import * as Google from "expo-auth-session/providers/google";
import { WebSocketResponse, SignInResponse } from "../../../server/src/api";
import WebSocketService, { ConnectMessage } from "@/services/WebSocketService";
// @ts-expect-error the image does exists so get rid of the error
import logo from "@/assets/images/Glogo.png";
// @ts-expect-error the image does exists so get rid of the error
import butterWalkLogo from "@/assets/images/butterWalkLogo.png";

const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const [accExists, setAccExists] = useState<boolean | null>(null);
  const [errMsg, setErrMsg] = useState(""); // Note: fix error msg display
  const [netid, setNetid] = useState("");

  const config = {
    webClientId,
    iosClientId,
    androidClientId,
  };

  const [request, response, promptAsync] = Google.useAuthRequest(config);

  const handleSigninMessage = (message: WebSocketResponse) => {
    if ("response" in message && message.response == "SIGNIN") {
      const signinresp = message as SignInResponse;

      if (signinresp.alreadyExists) {
        console.log("redirecting to map");
        setAccExists(true);
      } else {
        console.log("redirecting to finish acc");
        setAccExists(false); // redundant but I just want to make sure
      }

      setNetid(signinresp.netid);
    } else {
      // there was a signin related error
      console.log(message);
    }
  };
  WebSocketService.addListener(handleSigninMessage, "SIGNIN");

  useEffect(() => {
    const connectWebSocket = async () => {
      // call our new route
      const msg: ConnectMessage = await WebSocketService.connect();
      if (msg == "Connected Successfully") {
        if (response) {
          WebSocketService.send({
            directive: "SIGNIN",
            response: response,
            role: "STUDENT",
          });
        }
      } else {
        console.log("failed to connect!!!");
      }
    };
    connectWebSocket();
  }, [response]);

  return accExists == true && netid ? (
    <Redirect
      href={{
        pathname: "/(student)/map",
        params: {
          netid: netid,
        },
      }}
    />
  ) : accExists == false && netid ? (
    <Redirect
      href={{
        pathname: "/(student)/finishAcc",
        params: {
          netid: netid,
        },
      }}
    />
  ) : (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
        <Text style={localStyles.text}>Husky ButterWalk</Text>
        <Image style={localStyles.logo} source={butterWalkLogo} />
        <Text style={localStyles.text}>Sign in</Text>
        <TouchableOpacity
          style={localStyles.glogo}
          onPress={() => promptAsync()}
        >
          <Image source={logo} />
          <Text>Sign in with UW Google</Text>
        </TouchableOpacity>

        <Pressable
          style={localStyles.button}
          onPress={() => setAccExists(false)}
        >
          <Text style={localStyles.text}>Bypass Signin</Text>
        </Pressable>

        <Text style={{ color: "red" }}>{errMsg}</Text>
      </KeyboardAvoidingView>
    </View>
  );
};

// MOVE THIS TO STYLES
export default Login;

const localStyles = StyleSheet.create({
  input: {
    height: 50,
    width: 300,
    borderWidth: 1,
    marginVertical: 4,
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#f9f9f9",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#4B2E83",
  },
  logo: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  glogo: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  text: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "black",
    justifyContent: "flex-start",
    fontFamily: "Encode Sans",
  },
  link: {
    fontSize: 14,
    color: "black",
  },
  linkText: {
    color: "purple",
  },
});
