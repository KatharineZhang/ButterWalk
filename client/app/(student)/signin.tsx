import { View, Text, TouchableOpacity, Image, Pressable } from "react-native";
import { styles } from "../../assets/styles";
import * as WebBrowser from "expo-web-browser";
// need to 'npx expo install expo-web-browser expo-auth-session expo-crypto' ON MAC
// or 'npm i expo-auth-session@~6.0.3' on windows
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import { Redirect, router, useLocalSearchParams, Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

// Images
// @ts-expect-error the image does exists so get rid of the error
import logo from "@/assets/images/GoogleG.png";
// @ts-expect-error the image does exists so get rid of the error
// import butterWalkLogo from "@/assets/images/butterWalkLogo.png";
import huskyCarImage from "@/assets/images/husky-car.png";
import { SafeAreaView } from "react-native-safe-area-context";
import WebSocketService, {
  WebsocketConnectMessage,
} from "@/services/WebSocketService";

const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  // comes from finishSignIn if any errors occur
  const { error } = useLocalSearchParams();
  const config = {
    webClientId,
    iosClientId,
    androidClientId,
  };

  // Request is needed to make google auth work without errors,
  // but is not explicitly used, hence the override
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [request, response, promptAsync] = Google.useAuthRequest(config);
  const [goToFinishAcc, setGoToFinishAcc] = useState<boolean>(false);

  useEffect(() => {
    if (response?.type === "success") {
      const serializedResponse = JSON.stringify(response);
      console.log(serializedResponse);
      console.log("OAuth code received. Navigating to redirect page.");
      // Passes the code to finishSignIn, which handles the Websocket exchange.
      router.replace({
        pathname: "/(student)/finishSignIn",
        params: { serializedResponse },
      });
    }
  }, [response]);

  const connectWebSocket = async () => {
    const msg: WebsocketConnectMessage = await WebSocketService.connect();
    if (msg === "Connected Successfully") {
      WebSocketService.send({
        directive: "CONNECT",
        netid: "snigsm",
        role: "STUDENT",
      });
    } else {
      console.log("Failed to connect to WebSocket.");
    }
  };

  return goToFinishAcc ? (
    <Redirect
      href={{
        pathname: "/(student)/finishAcc",
        params: {
          netid: "snigsm",
        },
      }}
    />
  ) : (
    <SafeAreaView style={[styles.container, { padding: 20 }]}>
      <View style={{ flex: 1, width: "100%", justifyContent: "space-between" }}>
        <View style={{ alignSelf: "flex-start" }}>
          <Link href="/driverOrstudent" asChild>
            <Pressable>
              <Ionicons name="arrow-back" size={40} color="#4B2E83" />
            </Pressable>
          </Link>
        </View>
        {/* Main Content */}
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={[styles.heading, { marginBottom: "5%" }]}>
            Welcome Student!
          </Text>
          <Image
            style={[
              styles.signInbottomImageContainer,
              { flex: 0.5, marginBottom: "5%" },
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
          <Text style={{ color: "red", marginTop: 10 }}>{error}</Text>
          <Pressable
            style={[styles.button, { position: "absolute", bottom: "5%" }]}
            onPress={() => {
              // temporary connection to websocket since we aren't going through the sign in process
              connectWebSocket();
              setGoToFinishAcc(true);
            }}
          >
            <Text style={styles.text}>Bypass Signin</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;