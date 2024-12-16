import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import { useState } from "react";
import { Redirect } from "expo-router";
import { styles } from "@/assets/styles";

const Login = () => {
  const [netID, setNetID] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const signIn = async () => {
    setLoading(true);
    setNetID(netID.trim());

    if (!netID) {
      alert("Driver Net ID is required");
      setLoading(false);

      return;
    }

    try {
      //call route
      // alert("call route here");
      setSignedIn(true);
    } catch (error: any) {
      console.error(error.message);
      alert("Sign In Failed" + error.message);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  if (signedIn) {
    return (
      <Redirect
        href={{
          pathname: "/pages-driver/(tabs)/",
          params: {
            netID: netID != "" ? netID.replace("@uw.edu", "") : "dev-netID",
          },
        }}
      />
    );
  }
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
        <TextInput
          value={netID}
          style={localStyles.input}
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
              <Text style={localStyles.text}>Log In</Text>
            </Pressable>
            <Text>For easier dev testing (will be removed later) </Text>
            <Pressable style={styles.button} onPress={() => setSignedIn(true)}>
              <Text style={localStyles.text}>Bypass Signin</Text>
            </Pressable>
          </>
        )}
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
});