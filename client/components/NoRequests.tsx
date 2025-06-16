import { View, Text } from "react-native";

type NoRequestsProps = {
  updateSideBarHeight: (height: number) => void;
};

export default function NoRequests({
  updateSideBarHeight,
}: NoRequestsProps) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: "white",
        paddingHorizontal: 16,
        borderRadius: 10,
        paddingVertical: "10%",
      }}
      onLayout={(event) => {
        // on render, update the sidebar height to the height of this component
        updateSideBarHeight(event.nativeEvent.layout.height);
      }}
    >
      <View style={{ height: "1%" }} />
      {/* Title */}
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
        No Requests Now
      </Text>
      <View style={{ height: "20%" }} />
      <Text style={{ fontSize: 15 }}>
        There are current no requests available. You are all caught up!
      </Text>
      <View style={{ height: 100  }} />
    </View>
  );
}
