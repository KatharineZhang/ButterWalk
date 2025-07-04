import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

interface BottomDrawerProps {
  children: React.ReactNode;
  bottomSheetRef: React.RefObject<BottomSheet | null>; // pass a reference to the bottom sheet for expansion
}

const BottomDrawer: React.FC<BottomDrawerProps> = ({
  children,
  bottomSheetRef,
}) => {
  // Snap points define how high the drawer can be
  const snapPoints = useMemo(() => ["40%", "89%"], []);

  return (
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
    width: "100%",
    height: "97%",
  },
});

export default BottomDrawer;
