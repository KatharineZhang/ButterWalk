import React from "react";
import { View, Text } from "react-native";
import { loadingPageCompStyles } from "../assets/styles";

interface loadingPageCompProps {
    pickUpLoc: string;
    dropOffLoc: string;
}

const loadingPageComp: React.FC<loadingPageCompProps> = ({pickUpLoc, dropOffLoc}) => {
    return (
        <View style={loadingPageCompStyles.rootContainer}>
            <View style={loadingPageCompStyles.pickUpContainer}>
                <Text style={loadingPageCompStyles.locationMainTextTypography}>Pickup</Text>
                <Text style={loadingPageCompStyles.locationSubTextTypography}>{pickUpLoc}</Text>
            </View>
            
            <View style={loadingPageCompStyles.dropOffContainer}>
                <Text style={loadingPageCompStyles.locationMainTextTypography}>Dropoff</Text>
                <Text style={loadingPageCompStyles.locationSubTextTypography}>{dropOffLoc}</Text>
            </View>
            
            <View style={loadingPageCompStyles.middleDisplayContainer}>
                <View style={loadingPageCompStyles.mainTextContainer}>
                    <Text style={loadingPageCompStyles.mainTextTypography}>Requesting a Ride</Text>
                </View>

                <View style={loadingPageCompStyles.subtextContainer}>
                    <Text style={loadingPageCompStyles.subtextTypography}>This could take a few minutes. Do NOT exit out of the app.</Text>
                </View>
            </View>
            
        </View>
    );
};

export default loadingPageComp;

