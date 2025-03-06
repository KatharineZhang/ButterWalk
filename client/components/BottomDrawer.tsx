import React, { useCallback, useMemo, useRef } from "react";
import { Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import RideRequestForm from "./RideRequestForm";

const BottomDrawer = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points define how high the drawer can be
  const snapPoints = useMemo(() => ["35%", "50%", "82%"], []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("Sheet moved to index:", index);
  }, []);

  // TODO: When keyboard is clicked, expand the drawer
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.bottomSheetContainer}>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose={false}
          index={0}
          style={styles.bottomSheet}
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
  },
  contentContainer: {
    padding: 15,
    width: "100%",
  },
});

export default BottomDrawer;
