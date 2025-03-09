import React, { useCallback, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

interface BottomDrawerProps {
  children: React.ReactNode;
}

const BottomDrawer: React.FC<BottomDrawerProps> = ({ children }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points define how high the drawer can be
  const snapPoints = useMemo(() => ["35%", "50%", "82%"], []);

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
          style={styles.bottomSheet}
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
  contentContainer: {
    padding: 15,
    width: "100%",
    backgroundColor: "white",
  },
});

export default BottomDrawer;
