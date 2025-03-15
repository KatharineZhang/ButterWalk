import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../assets/styles";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "react-native-paper";
import FAQ from "../app/(student)/faq";

interface ProgressBarProps {
  mainText: string;
  subText?: string;
  pickUpLocation: string;
  dropOffLocation: string;
  progress: number;
}

const RideProgressBar: React.FC<ProgressBarProps> = ({
  mainText,
  subText,
  pickUpLocation,
  dropOffLocation,
  progress,
}) => {
  const [FAQVisible, setFAQVisible] = useState(false);
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarTop}>
        <View style={styles.mainTextContainer}>
          <Text style={styles.mainText}>{mainText}</Text>
          <TouchableOpacity onPress={() => setFAQVisible(true)}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="black"
              position="absolute"
              right={0}
            />
          </TouchableOpacity>
          <FAQ isVisible={FAQVisible} onClose={() => setFAQVisible(false)} />
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
          <ProgressBar
            progress={progress}
            color="#C5B4E3"
            style={styles.progressBar}
          />
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

export default RideProgressBar;
