import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { styles } from "@/assets/styles";
import { Redirect, useLocalSearchParams } from "expo-router";
// import { registerUser } from "../../services/firebaseEmailAuth";

import {
  WebSocketResponse,
  FinishAccCreationResponse,
} from "../../../server/src/api";
import WebSocketService from "@/services/WebSocketService";

const finishAcc = () => {
  const [phoneNum, setPhoneNum] = useState("");
  const [studentNum, setStudentNum] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [accFinished, setAccFinished] = useState(false);

  const { netid } = useLocalSearchParams<{ netid: string }>();

  const setValues = async () => {
    const phoneNumberTemp = phoneNum.trim();
    const studentNumTemp = studentNum.trim();
    const preferredNameTemp = preferredName.trim();

    if (!phoneNumberTemp || !studentNumTemp || !preferredNameTemp) {
      alert("All fields are required");
      return;
    }

    const preferredNameRegex = /^[A-Za-z]+$/;
    if (!preferredNameRegex.test(preferredNameTemp)) {
      alert("Preferred name must be only english letters.");
      return;
    } else {
      setPreferredName(
        preferredName.charAt(0).toUpperCase() +
          preferredName.slice(1).toLowerCase()
      );
    }

    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (!phoneRegex.test(phoneNumberTemp)) {
      alert("Phone number must be in the format ###-###-####");
      return;
    }

    const studentNumRegex = /^\d{7}$/;
    if (!studentNumRegex.test(studentNumTemp)) {
      alert("Student number must have 7 numbers");
      return;
    }

    setPhoneNum(phoneNumberTemp);
    setStudentNum(studentNumTemp);
    setPreferredName(preferredNameTemp);

    const msg = await WebSocketService.connect();
    if (msg == "Failed to Connect") {
      // failed to connect!!
      console.log("FAILED TO CONNECT TO WS IN FINISHACC");
    }

    // 1. send this to the DB via websocket
    WebSocketService.send({
      directive: "FINISH_ACC",
      netid,
      phoneNum,
      studentNum,
      preferredName
    });
    // 2. get the response back (add listener)
    const handleFinishAccMessage = (message: WebSocketResponse) => {
      if ("response" in message && message.response == "FINISH_ACC") {
        const finishAccResp = message as FinishAccCreationResponse;

        if (finishAccResp.success) {
          console.log("redirecting to map");
          setAccFinished(true);
        } else {
          setAccFinished(false);
          console.log("Something wrong -- test");
        }
      }
    };
    WebSocketService.addListener(handleFinishAccMessage, "FINISH_ACC");
  };

  if (accFinished) {
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
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create Account</Text>

      <Text style={styles.description}>Preferred Name</Text>
      <TextInput
        value={preferredName}
        style={[styles.input, preferredName && styles.inputFocused]}
        placeholder="Preferred Name"
        placeholderTextColor={"#808080"}
        onChangeText={(text) => setPreferredName(text)}
        autoCapitalize="none"
      />

      <Text style={styles.description}>Student number ( ####### )</Text>
      <TextInput
        value={studentNum}
        style={[styles.input, studentNum && styles.inputFocused]}
        placeholder="Student Number"
        placeholderTextColor={"#808080"}
        onChangeText={(text) => setStudentNum(text)}
        autoCapitalize="none"
      />

      <Text style={styles.description}>
        Phone number ( ### - ### - #### )
      </Text>
      <TextInput
        value={phoneNum}
        style={[styles.input, phoneNum && styles.inputFocused]}
        placeholder="Phone Number"
        placeholderTextColor={"#808080"}
        onChangeText={(text) => setPhoneNum(text)}
        autoCapitalize="none"
      />

      <Pressable style={styles.button} onPress={setValues}>
        <Text style={styles.button_text}>Finish Sign Up</Text>
      </Pressable>
      <Text>For easier dev testing (will be removed later) </Text>
      <Pressable
        style={styles.button}
        onPress={() => setAccFinished(true)}
      >
        <Text style={styles.text}>Bypass Signin</Text>
      </Pressable>
    </View>
  );
};

export default finishAcc;