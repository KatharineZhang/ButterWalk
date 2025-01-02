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
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const signIn = async () => {
    setLoading(true);
    setEmail(email.trim());
    setPhoneNumber(phoneNumber.trim());

    if (!email || !phoneNumber) {
      alert("Email and phone number are required");
      setLoading(false);

      return;
    }

    const UWregex = /@uw.edu$/;
    if (!UWregex.test(email)) {
      alert("Enter a valid UW email");
      setLoading(false);
      return;
    }

    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert("Phone number must be in the format ###-###-####");
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
          pathname: "/pages-student/(tabs)",
          params: {
            netID: email != "" ? email.replace("@uw.edu", "") : "dev-netID",
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
        ></TextInput>
        <TextInput
          value={phoneNumber}
          style={localStyles.input}
          placeholder="Phone Number ( XXX - XXX - XXXX )"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setPhoneNumber(text)}
        ></TextInput>
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
