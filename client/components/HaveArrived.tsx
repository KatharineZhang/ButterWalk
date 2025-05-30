import { View } from "react-native";

type HaveArrivedProps = {
  pickUpLocation: {
    latitude: number;
    longitude: number;
  };
  dropOffLocation: {
    latitude: number;
    longitude: number;
  };

  estimatedPickupTime: number;
  estimatedDropOffTime: number;

  riderName: string;
  numPassengers: number;

  // Callback
  isFlagged: () => void;

  onDropOffComplete: () => void;
  setNotificationState: (state: { text: string }) => void;
};

export default function HaveArrived({
  pickUpLocation,
  dropOffLocation,
  estimatedPickupTime,
  estimatedDropOffTime,
  riderName,
  numPassengers,
  isFlagged,
  onDropOffComplete,
  setNotificationState,
}: HaveArrivedProps) {
  return <View>{/* No UI yet, just a dummy componenet */}</View>;
}
