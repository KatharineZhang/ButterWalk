import {
  View,
  Text,
  KeyboardAvoidingView,
  Pressable,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { useState } from "react";
import { styles } from "../../assets/styles";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// @ts-expect-error the image does exists so get rid of the error
import butterWalkLogo from "@/assets/images/butterWalkLogo.png";

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const [driverId, setDriverId] = useState<string>("");
  const [signedIn, setSignedIn] = useState<boolean | null>(false);
  const [errMsg, setErrMsg] = useState("");
  const [netid, setNetid] = useState("");

  // check that the driver ID input is correct
  // param: input - the driver id input in the sign in
  const checkDriverIdInput = () => {
    if (/^\d{7}$/.test(driverId)) {
      setSignedIn(true);
      setNetid("driverId"); // changed this!
      setErrMsg("");
    } else {
      setDriverId("");
      setSignedIn(false);
      setErrMsg("Driver ID must be exactly 7 digits.");
    }
  };

  // if signed in successfully, redirect
  return signedIn && netid ? (
    <Redirect
      href={{
        pathname: "/(driver)/home",
        params: {
          netid: netid,
        },
      }}
    />
  ) : (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
          <Text style={styles.appNameText}>Husky ButterWalk</Text>
          <Image style={styles.signinLogo} source={butterWalkLogo} />
          <Text style={styles.signInText}>Driver Sign In</Text> 
          <View style={{ height: 20 }}></View>

          <Text style={{ fontSize: 17, fontWeight: "500", }}>Driver ID</Text>

          {/* driver signin ID input box */}
          <TextInput
            value={driverId}
            style={[styles.input, driverId && styles.inputFocused]}
            placeholderTextColor={"#808080"}
            onChangeText={(text: string) => setDriverId(text)}
            autoCapitalize="none"
          />

          <Text style={{ color: "red" }}>{errMsg}</Text>

          <Pressable
            style={styles.signInButton}
            onPress={() => {
              checkDriverIdInput();
            }}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Login;
