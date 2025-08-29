import { View, Text, TouchableOpacity, Image } from "react-native";
import { useState, useEffect } from "react";
import { styles } from "../../assets/styles";
import { Redirect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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
// @ts-expect-error the image does exist
import logo from "@/assets/images/GoogleG.png";
// @ts-expect-error the image does exist
import huskyCarImage from "@/assets/images/husky-car.png";
import { SafeAreaView } from "react-native-safe-area-context";
import Loading from "../oauthredirect";

const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const [accExists, setAccExists] = useState<boolean | null>(null);
  // used to determine if loading page should be shown
  const [isAuthenticating, setIsAuthenticating] = useState(() => !!response);
  const [errMsg, setErrMsg] = useState("");
  const [netid, setNetid] = useState("");

  const router = useRouter();

  const config = {
    webClientId,
    iosClientId,
    androidClientId,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [request, response, promptAsync] = Google.useAuthRequest(config);

  const handleSigninMessage = (message: WebSocketResponse) => {
    if ("response" in message && message.response == "SIGNIN") {
      const signinResp = message as SignInResponse;

      // sets accExists, netId, and isAuthenticating so that we know which page to show
      setAccExists(signinResp.alreadyExists);
      setNetid(signinResp.netid);
      setIsAuthenticating(false);

      if (signinResp.alreadyExists) {
        // if account already exists
        router.push("/(student)/home");
      } else {
        router.push("/(student)/finishAcc"); // otherwise we go to finishAcc page
      }
    } else {
      const errorResp = message as ErrorResponse;
      setErrMsg(errorResp.error);
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    WebSocketService.addListener(handleSigninMessage, "SIGNIN");
    return () => {
      WebSocketService.removeListener(handleSigninMessage, "SIGNIN");
    };
  }, []);

  useEffect(() => {
    const connectWebSocket = async () => {
      if (response) {
        setIsAuthenticating(true); // show loading while waiting
        const msg: WebsocketConnectMessage = await WebSocketService.connect();
        if (msg === "Connected Successfully") {
          console.log("Signing in once");
          WebSocketService.send({
            directive: "SIGNIN",
            response,
            role: "STUDENT",
          });
        } else {
          setErrMsg("Failed to connect!!!");
          setIsAuthenticating(false);
        }
      }
    };
    connectWebSocket();
  }, [response]);

  // Redirects
  if (isAuthenticating) {
    //shows loading page if we are in the process of authenticating
    return <Loading />;
  }
  if (accExists === true && netid) {
    return (
      <Redirect href={{ pathname: "/(student)/home", params: { netid } }} />
    );
  }
  if (accExists === false && netid) {
    return (
      <Redirect
        href={{ pathname: "/(student)/finishAcc", params: { netid } }}
      />
    );
  }

  // Default welcome screen
  return (
    <SafeAreaView style={[styles.container, { padding: 20 }]}>
      <View style={{ flex: 1, width: "100%", justifyContent: "space-between" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text
            style={{
              fontSize: 35,
              fontWeight: "500",
              color: "#4B2E83",
              marginBottom: 20,
            }}
          >
            Welcome Student!
          </Text>
          <Image
            style={[
              styles.signInbottomImageContainer,
              { flex: 0.5, marginBottom: "10%" },
            ]}
            source={huskyCarImage}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 20,
              textAlign: "center",
              fontWeight: "500",
              color: "#4B2E83",
              lineHeight: 30,
              marginVertical: 20,
            }}
          >
            Start your SafeTrip journey by signing in with your UW email
          </Text>

          <TouchableOpacity
            style={{
              borderColor: "#4B2E83",
              borderWidth: 2,
              height: 50,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 10,
              width: "95%",
              flexDirection: "row",
            }}
            onPress={() => {
              promptAsync();
              // when we press this button, we are in the process of authenticating
              setIsAuthenticating(true);
            }}
          >
            <Image style={styles.signInGoogleLogo} source={logo} />
            <Text style={{ fontWeight: "bold", fontSize: 17, marginLeft: 30 }}>
              Sign in with UW Email
            </Text>
          </TouchableOpacity>
          <Text style={{ color: "red", marginTop: 10 }}>{errMsg}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;
