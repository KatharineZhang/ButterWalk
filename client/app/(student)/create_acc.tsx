import {
  ScrollView,
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
import { registerUser } from "../../../server/src/firebaseEmailAuth"

const createAcc = () => {

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [accCreated, setAccCreated] = useState(false);

  const create = async () => {
    setLoading(true);
    setFirstName(firstName.trim());
    setLastName(lastName.trim());
    setEmail(email.trim());
    setPhoneNumber(phoneNumber.trim());
    setPassword(password.trim());

    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      alert("All fields are required");
      setLoading(false);

      return;
    }

    const UWregex = /@uw.edu$/;
    if (!UWregex.test(email)) {
      alert("Please ensure your using your UW email");
      setLoading(false);
      return;
    }

    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert("Phone number must be in the format ###-###-####");
      setLoading(false);

      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("Password must be 8 characters long with a number and a symbol");
      setLoading(false);

      return;
    }

    setAccCreated(true);
    setLoading(false);
  };

  if (accCreated) {
    registerUser(firstName, lastName, email, phoneNumber, password, setLoading);
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
    <ScrollView contentContainerStyle={styles.scrollContainer} bounces={true}>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
        <Text>Welcome! Butter create your account below!</Text>
        <Text style={localStyles.description}>First Name (the same as your UW NetID):</Text>
        <TextInput
          value={firstName}
          style={localStyles.input}
          placeholder="First name"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setFirstName(text)}
          autoCapitalize="none"
        />

        <Text style={localStyles.description}>Last Name (the same as your UW NetID):</Text>
        <TextInput
          value={lastName}
          style={localStyles.input}
          placeholder="Last name"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setLastName(text)}
          autoCapitalize="none"
        />

        <Text style={localStyles.description}>Enter your UW email:</Text>
        <TextInput
          value={email}
          style={localStyles.input}
          placeholder="UW email"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setEmail(text)}
          autoCapitalize="none"
        />

        <Text style={localStyles.description}>Enter your phone number ( ### - ### - #### ):</Text>
        <TextInput
          value={phoneNumber}
          style={localStyles.input}
          placeholder="Phone Number"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setPhoneNumber(text)}
          autoCapitalize="none"
        />

        <Text style={localStyles.description}>Enter your password</Text>
        <Text style={localStyles.description}>(Minimum eight characters, at least one letter, one number and one special character):</Text>
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
            <Pressable style={localStyles.button} onPress={create}>
              <Text style={localStyles.text}>Create Account</Text>
            </Pressable>
            <Text>For easier dev testing (will be removed later) </Text>
            <Pressable
              style={localStyles.button}
              onPress={() => setAccCreated(true)}
            >
              <Text style={localStyles.text}>Bypass Signin</Text>
            </Pressable>
          </>
        )}
      </KeyboardAvoidingView>
      <Link href="/(student)/signin">
        <Text style={localStyles.link}>Already have an account? <Text style={localStyles.linkText}>Sign in here!</Text></Text>
      </Link>
    </ScrollView>
      );
    };

    export default createAcc;

    const localStyles = StyleSheet.create({
      input: {
        height: 50,
        width: 300,
        borderWidth: 1,
        marginVertical: 4,
        borderRadius: 4,
        padding: 10,
        backgroundColor: "#f9f9f9"
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
      description: {
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 0.25,
        color: "black",
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
