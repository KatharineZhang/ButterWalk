import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Pressable,
  TouchableOpacity,
  Image
} from "react-native";
import { useState, useEffect } from "react";
import { styles } from "@/assets/styles";
import { Redirect } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
// need to 'npx expo install expo-web-browser expo-auth-session expo-crypto'
import * as Google from "expo-auth-session/providers/google";
import { WebSocketResponse, SignInResponse } from "../../../server/src/api";
import WebSocketService, { ConnectMessage } from "@/services/WebSocketService";
// @ts-expect-error the image does exists so get rid of the error
import logo from '@/assets/images/Glogo.png';
// @ts-expect-error the image does exists so get rid of the error
import butterWalkLogo from '@/assets/images/butterWalkLogo.png';

// const DEBUG = true;

// put this in env
const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const [signedIn,setSignedIn] = useState(false);
  const [accExists, setAccExists] = useState<boolean | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [netid, setNetid] = useState("");
  const [fname, setFName] = useState("");
  const [lname, setLName] = useState("");
  
  const config = {
    webClientId,
    iosClientId,
    androidClientId
  }
  
  let email = "";
  
  const [request, response, promptAsync] = Google.useAuthRequest(config);

  const getUserProfile = async (token: string) => {
    if(!token) return;
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", 
          {headers: {Authorization: `Bearer ${token}`}});
      
      const userInfo = await response.json();
      email = userInfo.email;

      const UWregex = /@uw.edu$/;
      if (!UWregex.test(email)) {
        // alert("Please ensure your using your UW email");
        setErrMsg("Please ensure your using your UW email");
        setSignedIn(false);
        return;
      }
      setSignedIn(true);

      setFName(userInfo.given_name);
      setLName(userInfo.family_name);
      setNetid(email.replace("@uw.edu", ""));

    } catch (error) {
      console.log("error fetching user info", error);
    }
  }

  useEffect(() => {
    const connectWebSocket = async () => {
      if (netid && fname && lname) {
        // await the connection before sending sign in route
        const message: ConnectMessage = await WebSocketService.connect(netid as string, "STUDENT");
        console.log(message);
        if (message == "Connected Successfully") {
          WebSocketService.send({directive: "SIGNIN",
            netid: netid,
            first_name: fname,
            last_name: lname,
            phoneNum: "",
            studentNum: "",
            role: "STUDENT" });
        }
      }
    };
    connectWebSocket();
  }, [netid, fname, lname]);
  

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
    }
  };
  WebSocketService.addListener(handleSigninMessage, "SIGNIN");

  const handleToken = () => {
    if(response?.type === "success") {
      const {authentication} = response;
      if (authentication == null) {
        console.error("auth is null @126 singin.tsx");
      } else {
        const token = authentication.accessToken;
        console.log("access token", token);
        
        getUserProfile(token);
      }
    } else {
      setErrMsg("Error signing in. Make sure you're using your UW email.");
      console.log("error with response", response);
    }
  }

  useEffect(() => {
    handleToken();
  }, [response]);

  return (
    accExists == true && signedIn ? (
      <Redirect
        href={{
          pathname: "/(student)/map",
          params: {
            netid: netid,
          },
        }}
      />
    ) : accExists == false && signedIn ? (
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
          <TouchableOpacity style={localStyles.glogo} onPress={() => promptAsync()}>
            <Image source={logo} />
            <Text>Sign in with UW Google</Text>
          </TouchableOpacity>
  
          <Pressable style={localStyles.button} onPress={() => setSignedIn(true)}>
            <Text style={localStyles.text}>Bypass Signin</Text>
          </Pressable>
  
          <Text style={{ color: "red" }}>{errMsg}</Text>
        </KeyboardAvoidingView>
      </View>
    )
  );  
}


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
    width: '100%',
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
    color: "purple"
  },
});
