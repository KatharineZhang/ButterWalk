import {
  WebSocketResponse,
  ErrorResponse,
  StudentSignInResponse,
} from "../../../server/src/api";
import WebSocketService, {
  WebsocketConnectMessage,
} from "../../services/WebSocketService";

import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text } from "react-native";

const finishSignIn = () => {
  const [accExists, setAccExists] = useState<boolean | null>(null);
  const [netid, setNetid] = useState("");
  const {serializedResponse} = useLocalSearchParams();
  
  useEffect(() => {
    const finalSerializedResponse = Array.isArray(serializedResponse)
      ? serializedResponse[0]
      : serializedResponse;
    const decodedResponse = decodeURIComponent(finalSerializedResponse);
    const response = JSON.parse(decodedResponse);
    
    const handleSigninMessage = (message: WebSocketResponse) => {
      if ("response" in message && message.response == "SIGNIN") {
        const signinResp = message as StudentSignInResponse;
        if (signinResp.alreadyExists) {
          setAccExists(true);
        } else {
          setAccExists(false);
        }
        setNetid(signinResp.netid);
      } else {
        // there was a signin related error
        const errorResp = message as ErrorResponse;
        console.log(errorResp.error);
      }
    };
    
    WebSocketService.addListener(handleSigninMessage, "SIGNIN");
    
    const connectWebSocket = async () => {
      // call our new route
      const msg: WebsocketConnectMessage = await WebSocketService.connect();
      if (msg == "Connected Successfully") {
        if (serializedResponse) {
          WebSocketService.send({
            directive: "SIGNIN",
            response,
            role: "STUDENT",
          });
        }
      } else {
        console.log("failed to connect!!!");
      }
    };
    connectWebSocket();
  }, [serializedResponse]);

  useEffect(() => {
    if(accExists == true && netid !== "") {
      router.replace({ pathname: '/(student)/home', params: { netid } });
    } else if(accExists == false && netid !== "") {
      router.replace({ pathname: '/(student)/finishAcc', params: { netid } });
    }
  }, [accExists, netid]);

  return (
    <View>
      {/* Conditionally renders the correct UI based on state */}
      {accExists === null && <Text>Loading...</Text>}
      {accExists === true && <Text>Redirecting to home screen...</Text>}
      {accExists === false && <Text>Redirecting to account creation...</Text>}
    </View>
  );
}   
export default finishSignIn;
