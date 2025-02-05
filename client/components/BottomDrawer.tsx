import React, { useCallback, useMemo, useRef } from "react";
import { Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import RideRequestForm from "./RideRequestForm";

const BottomDrawer = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points define how high the drawer can be
  const snapPoints = useMemo(() => ["25%", "50%", "80%"], []); 

  const handleSheetChanges = useCallback((index: number) => {
    console.log("Sheet moved to index:", index);
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints} 
        onChange={handleSheetChanges}
      >
        <BottomSheetView style={styles.contentContainer}>
          <Text>Ride Request Form</Text>
          <RideRequestForm />
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    alignItems: "center",
  },
});

export default BottomDrawer;
