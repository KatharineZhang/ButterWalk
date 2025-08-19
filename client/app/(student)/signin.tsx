import { View, Text, Pressable, TouchableOpacity, Image } from "react-native";
import { useState, useEffect } from "react";
import { styles } from "../../assets/styles";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import {
  WebSocketResponse,
  SignInResponse,
  ErrorResponse,
} from "../../../server/src/api";
import WebSocketService, {
  WebsocketConnectMessage
} from "../../services/WebSocketService"; // WebsocketConnectMessage,

// Images
// @ts-expect-error the image does exists so get rid of the error
import logo from "@/assets/images/GoogleG.png";
// @ts-expect-error the image does exists so get rid of the error
// import butterWalkLogo from "@/assets/images/butterWalkLogo.png";
import huskyCarImage from "@/assets/images/husky-car.png";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthRequest, makeRedirectUri, exchangeCodeAsync } from "expo-auth-session";

const androidClientId = '31898801148-fu8ji5l2k42coc833csqqg8hovei99ua.apps.googleusercontent.com';

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const [accExists, setAccExists] = useState<boolean | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [netid, setNetid] = useState("");
    
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  }; 

  const redirectUri = makeRedirectUri({scheme: 'com.betterwalk.betterwalk'});
  console.log(redirectUri);
  // 

  // Request is needed to make google auth work without errors,
  // but is not explicitly used, hence the override
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [request, response, promptAsync] = useAuthRequest({
      clientId: androidClientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    }, discovery);

  const handleSigninMessage = (message: WebSocketResponse) => {
    if ("response" in message && message.response == "SIGNIN") {
      const signinResp = message as SignInResponse;
      if (signinResp.alreadyExists) {
        setAccExists(true);
        setNetid(signinResp.netid);
        //router.push("/(student)/home");
      } else {
        setAccExists(false);
        setNetid(signinResp.netid);
        //console.log(netid);
        //router.push("/(student)/finishAcc"); // redundant but I just want to make sure
      }
    } else {
      // there was a signin related error
      const errorResp = message as ErrorResponse;

      setErrMsg(errorResp.error);
    }
  };
  WebSocketService.addListener(handleSigninMessage, "SIGNIN");

  useEffect(() => {
      const handleAuthAndExchange = async () => {
      // Check for a successful response from the initial auth request.
      if (response?.type === "success" && response.params.code) {
        try {
          // Exchange the authorization code for tokens.
          const tokenResult = await exchangeCodeAsync(
            {
              clientId: androidClientId,
              redirectUri: redirectUri,
              code: response.params.code,
              // PKCE: The code verifier is required for security.
              extraParams: { code_verifier: request?.codeVerifier || '' },
            },
            discovery
          );

          // At this point, the tokenResult object contains your tokens!
          console.log("Tokens received:", tokenResult);

          // You can now connect and send the tokens to your server.
          const msg: WebsocketConnectMessage = await WebSocketService.connect();
          if (msg == "Connected Successfully") {
            if (response) {
              WebSocketService.send({
              directive: "SIGNIN",
              response: { ...response, authentication: tokenResult },
              role: "STUDENT",
              });
            }
          } else {
            console.log("failed to connect!!!");
          }
        } catch (error) {
          console.error("Error exchanging code for token:", error);
          setErrMsg("Sign-in failed. Please try again.");
        }
      }
    };
    if (request && response) {
      handleAuthAndExchange();
    }
  }, [response, request]);

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
