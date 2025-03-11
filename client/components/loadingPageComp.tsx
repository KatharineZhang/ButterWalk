import React from "react";
import { View, Text } from "react-native";
import { loadingPageCompStyles } from "../assets/styles";

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

            <View style={loadingPageCompStyles.mainTextContainer}>
                <Text style={loadingPageCompStyles.mainTextTypography}>Requesting a Ride</Text>
            </View>
            <View style={loadingPageCompStyles.subtextContainer}>
                <Text style={loadingPageCompStyles.subtextTypography}>This could take a few minutes. Do NOT exit out of the app.</Text>
            </View>
        </View>
    );
};

export default loadingPageComp;

