import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

interface BottomDrawerProps {
  children: React.ReactNode;
  bottomSheetRef: React.RefObject<BottomSheet>; // pass a reference to the bottom sheet for expansion
}

const BottomDrawer: React.FC<BottomDrawerProps> = ({
  children,
  bottomSheetRef,
}) => {
  // Snap points define how high the drawer can be
  const snapPoints = useMemo(() => ["27%", "89%"], []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.bottomSheetContainer}>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          index={0}
        >
          <BottomSheetView style={styles.contentContainer}>
            {children}
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomSheetContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "absolute",
    bottom: 0,
  },
  contentContainer: {
    padding: 15,
    width: "100%",
    backgroundColor: "white",
  },
});

export default BottomDrawer;
