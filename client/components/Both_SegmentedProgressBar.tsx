import { styles } from "@/assets/styles";
import { View } from "react-native";
// import { ProgressBar } from "react-native-paper";

type SegmentedProgressBarProps = {
  type: 1 | 2 | 3;
};
export default function SegmentedProgressBar({
  type,
}: SegmentedProgressBarProps) {
  return (
    <View>
      {type == 1 ? (
        <View style={[styles.segmentedProgressContainer]}>
          <View
            style={[
              styles.segmentedProgressBar,
              { backgroundColor: "#4B2E83" },
            ]}
          />
          <View style={{ width: 2 }} />
          <View
            style={[
              styles.segmentedProgressBar,
              { backgroundColor: "#C1C1C1" },
            ]}
          />
          <View style={{ width: 2 }} />
          <View
            style={[
              styles.segmentedProgressBar,
              { backgroundColor: "#C1C1C1" },
            ]}
          />
        </View>
      ) : type == 2 ? (
        <View style={styles.segmentedProgressContainer}>
          <View
            style={[
              styles.segmentedProgressBar,
              { backgroundColor: "#4B2E83" },
            ]}
          />
          <View style={{ width: 2 }} />
          <View
            style={[
              styles.segmentedProgressBar,
              { backgroundColor: "#4B2E83" },
            ]}
          />

          <View style={{ width: 2 }} />
          <View
            style={[
              styles.segmentedProgressBar,
              { backgroundColor: "#C1C1C1" },
            ]}
          />
        </View>
      ) : (
        <View style={styles.segmentedProgressContainer}>
          <View
            style={[
              styles.segmentedProgressBar,
              { backgroundColor: "#4B2E83" },
            ]}
          />
          <View style={{ width: 2 }} />
          <View
            style={[
              styles.segmentedProgressBar,
              { backgroundColor: "#4B2E83" },
            ]}
          />
          <View style={{ width: 2 }} />
          <View
            style={[
              styles.segmentedProgressBar,
              { backgroundColor: "#4B2E83" },
            ]}
          />
        </View>
      )}
    </View>
  );
}
