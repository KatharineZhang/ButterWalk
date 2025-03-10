import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import { useState } from "react";
import { Redirect } from "expo-router";
import { styles } from "@/assets/styles";

const Login = () => {
  const [netid, setNetID] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const signIn = async () => {
    setLoading(true);
    setNetID(netid.trim());

    if (!netid) {
      alert("Driver Net ID is required");
      setLoading(false);

      return;
    }

    try {
      setSignedIn(true);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        alert("Sign In Failed" + error.message);
      } else {
        console.error("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  if (signedIn) {
    return (
      <Redirect
        href={{
          pathname: "/(driver)/map",
          params: {
            netid: netid != "" ? netid.replace("@uw.edu", "") : "driver-netID",
          },
        }}
      />
    );
  }
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
        <TextInput
          value={netid}
          style={styles.input}
          placeholder="UW Police Department Driver NetID"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setNetID(text)}
          autoCapitalize="none"
        ></TextInput>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            <Pressable style={styles.button} onPress={signIn}>
              <Text style={styles.text}>Log In</Text>
            </Pressable>
            <Text>For easier dev testing (will be removed later) </Text>
            <Pressable style={styles.button} onPress={() => setSignedIn(true)}>
              <Text style={styles.text}>Bypass Signin</Text>
            </Pressable>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default Login;
