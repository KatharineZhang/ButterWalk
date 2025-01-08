import Button from "@/components/button";
import { View } from "react-native";

export default function driverOrstudent() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {/* for testing I have it just go directly to the tabs, but ideally we would want it to go to
      /pages-driver/onboarding or signin, or like an api call to check if the user is logged in or not */}
      <Button label="I'm a UWPD Driver" link="/(driver)/signin" />
      <Button label="I'm a UW Student" link="/(student)/signin" />
    </View>
  );
}
