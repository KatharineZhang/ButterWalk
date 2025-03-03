import React, { useCallback, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import RideRequestForm from "./RideRequestForm";

const BottomDrawer = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points define how high the drawer can be
  const snapPoints = useMemo(() => ["25%", "50%", "82%"], []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("Sheet moved to index:", index);
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.bottomSheetContainer}>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose={false}
          index={0}
        >
          <BottomSheetView style={styles.contentContainer}>
            <RideRequestForm />
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "absolute",
    bottom: 0,
  },
  bottomSheetContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "absolute",
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    padding: 15,
    width: "100%",
    backgroundColor: "white", // Add background color to make content visible
  },
});

export default BottomDrawer;
