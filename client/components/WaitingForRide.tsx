/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import { View, Image, Text, Pressable } from "react-native";

interface WaitingForRideProps {
  driverETA: number; // estimated time of arrival for the driver
  onCancel: () => void; // callback function for when the user cancels ride
}

export default function WaitingForRide({
  driverETA,
  onCancel,
}: WaitingForRideProps) {
  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 10,
        position: "absolute",
        bottom: -10,
        width: "100%",
        height: "28%",
        padding: 10,
      }}
    >
      <View style={{ height: 10 }} />
      <Text style={styles.bottomModalTitle}>Waiting For Your Ride</Text>
      <View style={{ height: 20 }} />
      {/* Wait Time Display */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Image
          source={require("@/assets/images/wait-time-clock.png")}
          style={{ width: 20, height: 20 }}
        />
        <View style={{ width: 15 }} />
        <Text style={styles.waitTimeText}>
          Estimated Wait Time: {driverETA > 0 ? driverETA : "< 1"} minute(s)
        </Text>
      </View>
      <View style={{ height: 10 }} />
      {/* Cancel Button */}
      <View
        style={[styles.bottomModalButtonContainer, { paddingHorizontal: 10 }]}
      >
        <Pressable
          style={[
            styles.bottomModalButton,
            { borderWidth: 2, borderColor: "red", backgroundColor: "white" },
          ]}
          onPress={onCancel}
        >
          <Text style={[styles.buttonText, { color: "red" }]}>Cancel Ride</Text>
        </Pressable>
      </View>
    </View>
  );
}
