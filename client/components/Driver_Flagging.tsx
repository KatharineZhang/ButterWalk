import { View, Pressable, Text } from "react-native";
type FlaggingProps = {
  onFlag: (reason: string) => void;
  closePopUp: () => void; // Optional prop to close the popup after flagging
};

const FLAG_REASONS = ["Add potential reasons here! "] as const;

export default function Flagging({ onFlag }: FlaggingProps) {
  // TODO: FIX the styling of this component
  return (
    <View>
      <Pressable onPress={close}>
        <Text>Close</Text>
      </Pressable>
      <Text>Flagging Options:</Text>
      {FLAG_REASONS.map((reason) => (
        <Pressable key={reason} onPress={() => onFlag(reason)}>
          <Text>{reason}</Text>
        </Pressable>
      ))}
    </View>
  );
}
