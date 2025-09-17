import { Linking } from "react-native";

export const makeCall = (phoneNumber: string) => {
  if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
    console.error("Invalid phone number: ", phoneNumber);
    return;
  }
  const phoneUrl = `tel:${phoneNumber}`;
  Linking.openURL(phoneUrl).catch((err) =>
    console.error("Error making call: ", err)
  );
};
