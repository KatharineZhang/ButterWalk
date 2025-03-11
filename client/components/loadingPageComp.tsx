import React from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";

interface loadingPageCompProps {
    pickUpLoc: string;
    dropOffLoc: string;
}

const loadingPageComp: React.FC<loadingPageCompProps> = ({pickUpLoc, dropOffLoc}) => {
    return (
        <View>
            <Text>Pickup</Text>
            <Text>{pickUpLoc}</Text>

            <Text>Dropoff</Text>
            <Text>{dropOffLoc}</Text>

            <Text>Requesting a Ride</Text>
            <Text>This could take a few minutes. Do NOT exit out of the HUSKY ButterWalk App.</Text>
        </View>
    );
};

export default loadingPageComp;

