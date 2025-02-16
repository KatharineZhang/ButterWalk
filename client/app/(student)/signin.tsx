import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect } from "react";
import { styles } from "@/assets/styles";
import { Redirect, Link } from "expo-router";

import { Image } from "react-native";
import * as WebBrowser from 'expo-web-browser';
// need to 'npx expo install expo-web-browser expo-auth-session expo-crypto'
import * as Google from "expo-auth-session/providers/google";
import { WebSocketResponse, SignInResponse } from "../../../server/src/api";
import WebSocketService from "@/services/WebSocketService";

const DEBUG = false;

const webClientId = '115222638597-9fsnarg3ujfemeb2vmtj5spscbj4ei8a.apps.googleusercontent.com';
const iosClientId = '115222638597-uisr924s4l8ngmg467u1ipsh0jli9hfd.apps.googleusercontent.com';
const androidClientId = '115222638597-45egn9a398joau1s6tmmd7qv6s68f47i.apps.googleusercontent.com';

WebBrowser.maybeCompleteAuthSession();


const Login = () => {
  const [signedIn,setSignedIn] = useState(false);
  const [accExists, setAccExists] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  
  const config = {
    webClientId,
    iosClientId,
    androidClientId
  }

  // FIX THIS LATER!!! THIS ISN'T GOOD PRACTIFCE!!
  let email = "";
  let first_name = "";
  let last_name = "";
  let netid = "";


  const [request, response, promptAsync] = Google.useAuthRequest(config);

  const getUserProfile = async (token: any) => {
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

      first_name = userInfo.given_name;
      last_name = userInfo.family_name;
      netid = email.replace("@uw.edu", "");

      WebSocketService.connect(netid as string, "STUDENT");

      // 1. send this to the DB via websocket
      WebSocketService.send({directive: "SIGNIN",
        netid,
        first_name,
        last_name,
        phoneNum: "",
        studentNum: "",
        role: "STUDENT" });
      // 2. get the response back (add listener)
      const handleSigninMessage = (message: WebSocketResponse)  => {
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
      }
      
      WebSocketService.addListener(handleSigninMessage, "SIGNIN");

    } catch (error) {
      console.log("error fetching user info", error);
    }
  }

  const handleToken = () => {
    if(response?.type === "success") {
      const {authentication} = response;
      const token = authentication?.accessToken;
      console.log("access token", token);
      
      getUserProfile(token);
    } else {
      setErrMsg("Error signing in. Make sure you're using your UW email.");
      console.log("error with response", response);
    }
  }


  useEffect(() => {
    handleToken();
  }, [response]);


  if(signedIn) {
    if(accExists) {
      return (
        <Redirect
          href={{
            pathname: "/(student)/map",
            params: {
              netid: netid != "" ? netid : "dev-netID",
            },
          }}
        />
      );
    } else {
      return (
        <Redirect
          href={{
            pathname: "/(student)/finishAcc",
            params: { netid: netid != "" ? netid : "dev-netID"}
          }}
        />
      );
    }
  }

  

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
        <Text>Welcome Back!</Text>

        <TouchableOpacity onPress={() => promptAsync()}>
          <Image source={require("../../assets/images/Glogo.png")} />
          <Text>Sign in with UW Google</Text>
        </TouchableOpacity>

        <Pressable style={localStyles.button} onPress={() => setSignedIn(true)}>
          <Text style={localStyles.text}>Bypass Signin</Text>
        </Pressable>

        <Text style={{ color: "red" }}>{errMsg}</Text>
      </KeyboardAvoidingView>
    </View>
  );
};

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
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
  },
  link: {
    fontSize: 14,
    color: "black",
  },
  linkText: {
    color: "purple",
    textDecorationLine: "underline",
  },
});
