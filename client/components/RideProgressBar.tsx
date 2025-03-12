import { View, Text } from "react-native";
// import { styles } from "../assets/styles";
import { StyleSheet } from "react-native";
import React from "react";
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from "react-native-paper";

interface ProgressBarProps {
    mainText: string;
    subText?: string;
    pickUpLocation: string;
    dropOffLocation: string;
    progress: number;
}

const RideProgressBar: React.FC<ProgressBarProps> = ({ mainText, subText, pickUpLocation, dropOffLocation, progress }) => {
    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressBarTop}>
                <View style={styles.mainTextContainer}>
                    <Text style={styles.mainText}>{mainText}</Text>
                    <Ionicons name="information-circle-outline" size={20} color="black" position="absolute" right={0} />
                </View>

                <View style={styles.subTextContainer}>
                    <Ionicons name="time-outline" size={18} color="black" />
                    <Text style={styles.subText}>{subText}</Text>
                </View>
            </View>
            <View style={styles.progressBarBottom}>
                <Text style={styles.rideTimeText}>10 min Ride</Text>
                <View style={styles.progressBarWrapper}>
                    <View style={styles.circleStart} />
                    <ProgressBar progress={progress} color="#C5B4E3" style={styles.progressBar} />
                    <View style={styles.circleEnd} />
                </View>

                <View style={styles.locationContainer}>
                    <View style={styles.pickUpContainer}>
                        <Text style={styles.locationTitle}>Pickup</Text>
                        <Text style={styles.locationText}>{pickUpLocation}</Text>
                    </View>
                    <View style={styles.dropOffContainer}>
                        <Text style={styles.locationTitle}>Dropoff</Text>
                        <Text style={styles.locationText}>{dropOffLocation}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    progressContainer: {
        position: "absolute",
        bottom: 0,
        backgroundColor: "white",
        padding: 16,
    },
    progressBarTop: {
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "#EEEEEE",
        padding: 15,
        marginBottom: 10,
    },
    mainTextContainer: {
        flexDirection: "row",
        marginBottom: 10,
    },
    mainText: {
        fontSize: 18,
        textAlign: "center",
        fontWeight: "bold",
        flex: 1,
    },
    subTextContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },
    subText: {
        fontSize: 16,
        marginLeft: 8,
    },
    progressBarBottom: {
        alignItems: "center",
    },
    rideTimeText: {
        fontSize: 12,
        fontWeight: "bold",
        marginVertical: 8,
    },
    progressBarWrapper: {
        flexDirection: "row",
        alignItems: "center",
        width: 320,
        position: "relative",
    },
    progressBar: {
        flex: 1,
        height: 15,
        borderRadius: 6,
        backgroundColor: "#E3E3E3",
        maxWidth: "100%",
        width: 370,
        zIndex: 1,
    },
    circleStart: {
        width: 22,
        height: 22,
        borderRadius: 13,
        backgroundColor: "#4B2E83",
        borderWidth: 2,
        borderColor: "#000000",
        position: "absolute",
        left: 0,
        zIndex: 2,
    },
    circleEnd: {
        width: 22,
        height: 22,
        borderRadius: 13,
        backgroundColor: "#E34B64",
        borderWidth: 2,
        borderColor: "#000000",
        position: "absolute",
        right: 0,
        zIndex: 2,
    },
    locationContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 15,
    },
    pickUpContainer: {
        alignItems: "flex-start",
        maxWidth: "50%"
    },
    dropOffContainer: {
        alignItems: "flex-end",
        maxWidth: "50%"
    },
    locationTitle: {
        fontWeight: "bold",
        fontSize: 12,
        marginBottom: 3,
    },
    locationText: {
        fontSize: 12,
    },
});

export default RideProgressBar;