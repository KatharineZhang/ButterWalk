import {
  View,
  Text,
  KeyboardAvoidingView,
  Pressable,
  TouchableOpacity,
  Image,
} from "react-native";
import { useState, useEffect } from "react";
import { styles } from "../../assets/styles";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// need to 'npx expo install expo-web-browser expo-auth-session expo-crypto' ON MAC
// or 'npm i expo-auth-session@~6.0.3' on windows
import * as Google from "expo-auth-session/providers/google";

import {
  WebSocketResponse,
  SignInResponse,
  ErrorResponse,
} from "../../../server/src/api";
import WebSocketService, {
  WebsocketConnectMessage,
} from "../../services/WebSocketService";

// Images
// @ts-expect-error the image does exists so get rid of the error
import logo from "@/assets/images/GoogleG.png";
// @ts-expect-error the image does exists so get rid of the error
import butterWalkLogo from "@/assets/images/butterWalkLogo.png";
import huskyCarImage from "@/assets/images/husky-car.png";
import { SafeAreaView } from "react-native-safe-area-context";

const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const [accExists, setAccExists] = useState<boolean | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [netid, setNetid] = useState("");

  const config = {
    webClientId,
    iosClientId,
    androidClientId,
  };

  // Request is needed to make google auth work without errors,
  // but is not explicitly used, hence the override
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [request, response, promptAsync] = Google.useAuthRequest(config);

  const handleSigninMessage = (message: WebSocketResponse) => {
    if ("response" in message && message.response == "SIGNIN") {
      const signinResp = message as SignInResponse;

      if (signinResp.alreadyExists) {
        setAccExists(true);
      } else {
        setAccExists(false); // redundant but I just want to make sure
      }

      setNetid(signinResp.netid);
    } else {
      // there was a signin related error
      const errorResp = message as ErrorResponse;

      setErrMsg(errorResp.error);
    }
  };
  WebSocketService.addListener(handleSigninMessage, "SIGNIN");

  useEffect(() => {
    const connectWebSocket = async () => {
      // call our new route
      const msg: WebsocketConnectMessage = await WebSocketService.connect();
      if (msg == "Connected Successfully") {
        if (response) {
          WebSocketService.send({
            directive: "SIGNIN",
            response,
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
        pathname: "/(student)/home",
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
    <SafeAreaView style={styles.container}>
      <Text style={styles.appNameText}>Husky ButterWalk</Text>
      <Image style={styles.signInbottomImageContainer} source={huskyCarImage} />
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
        
        
        <Text style={styles.signInText}>start your ride by signing in!</Text>
        <View style={{ height: 20 }}></View>

        <TouchableOpacity
          style={styles.signInGoogleContainer}
          onPress={() => promptAsync()}
        >
          <Image style={styles.signInGoogleLogo} source={logo} />
          <Text style={{ fontWeight: "bold", fontSize: 17}}>
            Sign in with UW Email
          </Text>
        </TouchableOpacity>
        <Text style={{ color: "red" }}>{errMsg}</Text>

        {/* TEMPORARY Bypass Signin Button */}
        <View style={{ height: 20 }}></View>
        <Pressable
          style={styles.signInButton}
          onPress={() => {
            setAccExists(false);
            setNetid("student-netID");
          }}
        >
        <Text style={styles.signInText}>Bypass Signin</Text>
        </Pressable>
      </KeyboardAvoidingView>
      
    </SafeAreaView>
  );
};

export default Login;
