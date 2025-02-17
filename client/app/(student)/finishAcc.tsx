import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useState } from "react";
import { styles } from "@/assets/styles";
import { Redirect, Link } from "expo-router";
import { registerUser } from "../../services/firebaseEmailAuth";

import { WebSocketResponse, GeneralResponse } from "../../../server/src/api";
import WebSocketService from "@/services/WebSocketService";


const  finishAcc = (netid: string) => {  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studentNum, setStudentNum] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [accFinished, setAccFinished] = useState(false);
  

  const setValues = async () => {
    
    setPhoneNumber(phoneNumber.trim());
    setStudentNum(studentNum.trim());

    if ( !phoneNumber || !studentNum) {
      alert("All fields are required");
      return;
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
    const handleSigninMessage = (message: WebSocketResponse)  => {
      if ("response" in message && message.response == "FINISH_ACC") {
        const finishAccResp = message as GeneralResponse;

        if (finishAccResp.success) {
          setAccFinished(true);
        }
      }
    }
    WebSocketService.addListener(handleSigninMessage, "FINISH_ACC");
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
        <Text>Create Account</Text>
       
        <Text style={localStyles.description}>Preferred Name</Text>
        <TextInput
          value={preferredName}
          style={localStyles.input}
          placeholder="Preferred Name"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setPreferredName(text)}
          autoCapitalize="none"
        />

        <Text style={localStyles.description}>Student number ( ####### )</Text>
        <TextInput
          value={studentNum}
          style={localStyles.input}
          placeholder="Student Number"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setStudentNum(text)}
          autoCapitalize="none"
        />

        <Text style={localStyles.description}>Phone number ( ### - ### - #### )</Text>
        <TextInput
          value={phoneNumber}
          style={localStyles.input}
          placeholder="Phone Number"
          placeholderTextColor={"#808080"}
          onChangeText={(text) => setPhoneNumber(text)}
          autoCapitalize="none"
        />        
        
        <Pressable style={localStyles.button} onPress={setValues}>
          <Text style={localStyles.text}>Sign Up</Text>
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
