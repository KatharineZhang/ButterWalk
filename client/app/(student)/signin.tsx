import { View, Text, Pressable, TouchableOpacity, Image } from "react-native";
import { useState, useEffect } from "react";
import { styles } from "../../assets/styles";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
// import { makeRedirectUri } from 'expo-auth-session';

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
// import butterWalkLogo from "@/assets/images/butterWalkLogo.png";
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
  // const redirectURI = makeRedirectUri();

  const config = {
    webClientId,
    iosClientId,
    androidClientId,
    // redirectURI
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
    <SafeAreaView style={[styles.container, { padding: 20 }]}>
      <View style={{ flex: 1, width: "100%", justifyContent: "space-between" }}>
        {/* Main Content */}
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
            onPress={() => promptAsync()}
          >
            <Image style={styles.signInGoogleLogo} source={logo} />
            <Text style={{ fontWeight: "bold", fontSize: 17, marginLeft: 30 }}>
              Sign in with UW Email
            </Text>
          </TouchableOpacity>
          <Text style={{ color: "red", marginTop: 10 }}>{errMsg}</Text>
        </View>

        {/* TEMPORARY Bypass Button */}
        <View style={{ paddingBottom: 20 }}>
          <Pressable
            style={styles.signInButton}
            onPress={() => {
              setAccExists(false);
              setNetid("snigsm");
            }}
          >
            <Text style={styles.signInText}>Bypass Signin</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;