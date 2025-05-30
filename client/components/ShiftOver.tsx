import { View } from "react-native";
import LogoutWarning from "./LogoutWarning";

type ShiftIsOverProps = {
  isLoggedIn: boolean;
  onLogout: () => void;
};

export default function ShiftIsOver({
  isLoggedIn,
  onLogout,
}: ShiftIsOverProps) {
  // if driver is logged in, show the logout warning
  if (isLoggedIn) {
    return <LogoutWarning onLogout={onLogout} />;
  }
  return <View>{/* No UI yet, just a dummy componenet */}</View>;
}
