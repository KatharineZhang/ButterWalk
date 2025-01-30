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
import { styles } from "@/assets/styles";
import { Redirect, Link } from "expo-router";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const signIn = async () => {
    setLoading(true);
    setEmail(email.trim());
    setPassword(password.trim());

    if (!email || !password) {
      alert("Email and password are required");
      setLoading(false);

      return;
    }

    const UWregex = /@uw.edu$/;
    if (!UWregex.test(email)) {
      alert("Enter a valid UW email");
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("Password must be at least 8 characters long and include at least one letter, one number, and one special character.");
      setLoading(false);

      return;
    }
    setSignedIn(true);
    setLoading(false);
  };

  if (signedIn) {
    return (
      <Redirect
        href={{
          pathname: "/(student)/map",
          params: {
            netid: email != "" ? email.replace("@uw.edu", "") : "dev-netID",
          },
        }}
      />
    );
  }
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
        <Text>Welcome Back!</Text>
        <TextInput
          value={email}
          style={localStyles.input}
          placeholder="UW Email"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setEmail(text)}
          autoCapitalize="none"
        />
        <TextInput
          value={password}
          style={localStyles.input}
          placeholder="Password"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setPassword(text)}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            <Pressable style={localStyles.button} onPress={signIn}>
              <Text style={localStyles.text}>Log In</Text>
            </Pressable>
            <Text>For easier dev testing (will be removed later) </Text>
            <Pressable
              style={localStyles.button}
              onPress={() => setSignedIn(true)}
            >
              <Text style={localStyles.text}>Bypass Signin</Text>
            </Pressable>
          </>
        )}
      </KeyboardAvoidingView>
      <Link href="/(student)/create_acc">
        <Text style={localStyles.link}>Don't have an account yet? <Text style={localStyles.linkText}>Create Account here!</Text></Text>
      </Link>
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
