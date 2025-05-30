import { View } from "react-native";
type FlaggingProps = {
  studentNetId: string;
  studentName: string;
  onFlag: (reason: string) => void;
  isFlagged: boolean;
};

const FLAG_REASONS = ["Add potential reasons here! "] as const;

export default function Flagging({
  studentNetId,
  studentName,
  onFlag,
  isFlagged,
}: FlaggingProps) {
  return <View></View>;
}
