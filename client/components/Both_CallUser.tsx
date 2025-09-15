import { Linking } from "react-native";

export const makeCall = () => {
  const phoneNumber = "1234567890"; 
  const phoneUrl = `tel:${phoneNumber}`;
  Linking.openURL(phoneUrl).catch((err) =>
    console.error("Error making call: ", err)
  );
};
