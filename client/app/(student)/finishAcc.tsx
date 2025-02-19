import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
} from "react-native";
import { useState } from "react";
import { styles } from "@/assets/styles";
import { Redirect, useLocalSearchParams } from "expo-router";
// import { registerUser } from "../../services/firebaseEmailAuth";

import { WebSocketResponse, FinishAccCreationResponse } from "../../../server/src/api";
import WebSocketService from "@/services/WebSocketService";


const  finishAcc = (netid: string) => {  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studentNum, setStudentNum] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [accFinished, setAccFinished] = useState(false);
  
  // const { netid } = useLocalSearchParams<{ netid: string }>();
  console.log("finish acc netid: ", netid);

  const setValues = async () => {
    
    setPhoneNumber(phoneNumber.trim());
    setStudentNum(studentNum.trim());
    setPreferredName(preferredName.trim());

    if ( !phoneNumber || !studentNum || !preferredName) {
      alert("All fields are required");
      return;
    }

    const preferredNameRegex = /^[A-Za-z]+$/;
    if (!preferredNameRegex.test(preferredName)) {
      alert("Preferred name must be only english letters.")
      return;
    } else {
      setPreferredName(preferredName.charAt(0).toUpperCase() + preferredName.slice(1).toLowerCase());
    }

    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert("Phone number must be in the format ###-###-####");
      return;
    }

    const studentNumRegex = /^\d{7}$/;
    if (!studentNumRegex.test(studentNum)) {
      alert("Student number must have 7 numbers");
      return;
    }

    
    WebSocketService.connect(netid as string, "STUDENT");

    // 1. send this to the DB via websocket
    WebSocketService.send({directive: "FINISH_ACC",
      netid,
      phoneNum: phoneNumber,
      studentNum: studentNum,
      role: "STUDENT"
    });
    // 2. get the response back (add listener)
    const handleFinishAccMessage = (message: WebSocketResponse)  => {
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
    }
    WebSocketService.addListener(handleFinishAccMessage, "FINISH_ACC");
  }


  if(accFinished) {
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
        <Text style={localStyles.heading}>Create Account</Text>
       
        <Text style={localStyles.description}>Preferred Name</Text>
        <TextInput
          value={preferredName}
          style={[localStyles.input, preferredName && localStyles.inputFocused]}
          placeholder="Preferred Name"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setPreferredName(text)}
          autoCapitalize="none"
        />

        <Text style={localStyles.description}>Student number ( ####### )</Text>
        <TextInput
          value={studentNum}
          style={[localStyles.input, studentNum && localStyles.inputFocused]}
          placeholder="Student Number"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setStudentNum(text)}
          autoCapitalize="none"
        />

        <Text style={localStyles.description}>Phone number ( ### - ### - #### )</Text>
        <TextInput
          value={phoneNumber}
          style={[localStyles.input, phoneNumber && localStyles.inputFocused]}
          placeholder="Phone Number"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setPhoneNumber(text)}
          autoCapitalize="none"
        />        
        
        <Pressable style={localStyles.button} onPress={setValues}>
          <Text style={localStyles.button_text}>Finish Sign Up</Text>
        </Pressable>
        <Text>For easier dev testing (will be removed later) </Text>
        <Pressable
          style={localStyles.button}
          onPress={() => setAccFinished(true)}
        >
          <Text style={localStyles.text}>Bypass Signin</Text>
        </Pressable>
        
        
    </View>
    );
  };

    export default finishAcc;

    const localStyles = StyleSheet.create({
      input: {
        height: 50,
        width: 300,
        borderWidth: 1,
        marginVertical: 4,
        borderRadius: 4,
        padding: 10,
        backgroundColor: "#f9f9f9",
        textAlign: "left",
        borderColor: "#ccc",
      },
      inputFocused: {
        borderColor: "#4B2E83",
      },
      heading: {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: "bold",
        letterSpacing: 0.25,
        color: "black",
        justifyContent: "flex-start",
        fontFamily: "Encode Sans",
        textAlign: "left",
      },
      button: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 4,
        elevation: 3,
        backgroundColor: "#4B2E83",
        alignSelf: "center",
      },
      text: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: "bold",
        letterSpacing: 0.25,
        color: "black",
        textAlign: "left",
      },
      button_text: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: "bold",
        letterSpacing: 0.25,
        color: "white",
        fontFamily: "DM Sans",
        textAlign: "center",
      },
      description: {
        fontFamily: "Open Sans",
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 0.25,
        color: "black",
        textAlign: "left",
      }
    });
