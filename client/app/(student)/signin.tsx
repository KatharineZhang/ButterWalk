import { View, Text, TouchableOpacity, Image } from "react-native";
import { styles } from "../../assets/styles";
import * as WebBrowser from "expo-web-browser";
// need to 'npx expo install expo-web-browser expo-auth-session expo-crypto' ON MAC
// or 'npm i expo-auth-session@~6.0.3' on windows
import * as Google from "expo-auth-session/providers/google";
import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";

// Images
// @ts-expect-error the image does exists so get rid of the error
import logo from "@/assets/images/GoogleG.png";
// @ts-expect-error the image does exists so get rid of the error
// import butterWalkLogo from "@/assets/images/butterWalkLogo.png";
import huskyCarImage from "@/assets/images/husky-car.png";
import { SafeAreaView } from "react-native-safe-area-context";

const webClientId = '31898801148-fs0ddrh0mbbcv7atnc7v5q2r31u6i1bq.apps.googleusercontent.com';
const iosClientId = '31898801148-64e2hnf3f905e7bgfrrs2cf7ftsu8dnk.apps.googleusercontent.com';
const androidClientId = '31898801148-fu8ji5l2k42coc833csqqg8hovei99ua.apps.googleusercontent.com';

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  //const [errMsg, setErrMsg] = useState("");
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
      // Pass the code to your redirect page, which will handle the backend exchange.
      router.replace({ pathname: '/(student)/finishSignIn', params: { serializedResponse } });
    }
  }, [response]);

  return (
    <SafeAreaView style={[styles.container, { padding: 20 }]}>
      <View style={{ flex: 1, width: "100%", justifyContent: "space-between" }}>
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

// <Text style={{ color: "red", marginTop: 10 }}>{errMsg}</Text>
