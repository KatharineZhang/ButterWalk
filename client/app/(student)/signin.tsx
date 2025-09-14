import { View, Text, TouchableOpacity, Image, Pressable } from "react-native";
import { styles } from "../../assets/styles";
import * as WebBrowser from "expo-web-browser";
// need to 'npx expo install expo-web-browser expo-auth-session expo-crypto' ON MAC
// or 'npm i expo-auth-session@~6.0.3' on windows
import * as Google from "expo-auth-session/providers/google";
import { useEffect } from "react";
import { router, useLocalSearchParams, Link } from "expo-router";

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
  // comes from finishSignIn if any errors occur
  const {error} = useLocalSearchParams();
  const config = {
    webClientId,
    iosClientId,
    androidClientId,
  };

  // Request is needed to make google auth work without errors,
  // but is not explicitly used, hence the override
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [request, response, promptAsync] = Google.useAuthRequest(config);

  useEffect(() => {
    if (response?.type === 'success') {
      const serializedResponse = JSON.stringify(response);
      console.log(serializedResponse);
      console.log('OAuth code received. Navigating to redirect page.');
      // Passes the code to finishSignIn, which handles the Websocket exchange.
      router.replace({ pathname: '/(student)/finishSignIn', params: { serializedResponse } });
    }
  }, [response]);

  return (
    <SafeAreaView style={[styles.container, { padding: 20 }]}>
      <View style={{ flex: 1, width: "100%", justifyContent: "space-between" }}>
        <View style={styles.buttonContainer}>
                <Link href="/driverOrstudent" asChild>
                  <Pressable
                    style={{
                      borderColor: "#4B2E83",
                      borderWidth: 2,
                      width: "100%",
                      height: 50,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: "#4B2E83", fontSize: 20, fontWeight: "400" }}>
                      Back
                    </Text>
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
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;
