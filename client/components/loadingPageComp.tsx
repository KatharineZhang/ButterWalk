import React from "react";
import { View, Text } from "react-native";
import { loadingPageCompStyles } from "../assets/styles";

interface loadingPageCompProps {
  pickUpLoc: string;
  dropOffLoc: string;
}

const LoadingPageComp: React.FC<loadingPageCompProps> = ({
  pickUpLoc,
  dropOffLoc,
}) => {
  return (
      <View style={loadingPageCompStyles.rootContainer}>
        <View style={{ height: 50 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={loadingPageCompStyles.pickUpContainer}>
            <Text style={loadingPageCompStyles.locationMainTextTypography}>
              Pickup
            </Text>
            <Text style={loadingPageCompStyles.locationSubTextTypography}>
              {pickUpLoc}
            </Text>
          </View>
          <View style={{ width: "60%" }} />
          <View style={loadingPageCompStyles.dropOffContainer}>
            <Text style={loadingPageCompStyles.locationMainTextTypography}>
              Dropoff
            </Text>
            <Text style={loadingPageCompStyles.locationSubTextTypography}>
              {dropOffLoc}
            </Text>
          </View>
        </View>

        <View style={loadingPageCompStyles.middleDisplayContainer}>
          <View>
            <Text style={loadingPageCompStyles.mainTextTypography}>
              Requesting a Ride
            </Text>
          </View>

          <View>
            <Text style={loadingPageCompStyles.subtextTypography}>
              This could take a few minutes. Do NOT exit out of the app.
            </Text>
          </View>
        </View>
      </View>
  );
};

export default LoadingPageComp;
