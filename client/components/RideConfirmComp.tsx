import React from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";

interface RideConfirmCompProps {
    pickUpLoc: string;
    dropOffLoc: string;
    numPassengers: bigint;
    isVisible: boolean;
    onConfirm: () => void; // callback function for when the user confirms ride
    onCancel: () => void; // callback function for when the user cancels ride
}

const RideConfirmComp: React.FC<RideConfirmCompProps> = ({
    pickUpLoc,
    dropOffLoc,
    numPassengers,
    isVisible,
    onConfirm,
    onCancel
}) => {
    return (
        <Modal
            visible={isVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Confirm Ride Details</Text>
                    <Text style={styles.detailText}>Pick Up Location: {pickUpLoc}</Text>
                    <Text style={styles.detailText}>Drop Off Location: {dropOffLoc}</Text>
                    <Text style={styles.detailText}>Number of Passengers: {Number(numPassengers)}</Text>

                    <View style={styles.buttonsContainer}>
                        <Pressable style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
                            <Text style={styles.buttonText}>CONFIRM</Text>
                        </Pressable>
                        <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                            <Text style={styles.buttonText}>NO GO BACK</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)"
    },
    container: {
        width: "80%",
        padding: 20,
        backgroundColor: "white",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        alignItems: "center"
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10
    },
    detailText: {
        fontSize: 16,
        marginBottom: 8
    },
    buttonsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 20
    },
    button: {
        padding: 10,
        borderRadius: 5,
        width: "45%",
        alignItems: "center",
        justifyContent: "center"
    },
    confirmButton: {
        backgroundColor: "green"
    },
    cancelButton: {
        backgroundColor: "red"
    },
    buttonText: {
        color: "white",
        fontWeight: "bold"
    }
});

export default RideConfirmComp;
