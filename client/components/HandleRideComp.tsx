import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { styles } from "../assets/styles";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "react-native-paper";

interface HandleRideProps {
  pickUpLocation: string;
  dropOffLocation: string;
  status:
    | "WaitingForRide" // the ride has been requested
    | "DriverEnRoute" // the ride is accepted
    | "DriverArrived" // the driver is at the pickup location
    | "RideInProgress" // the driver is taking the student to dropoff location
    | "RideCompleted"; // the driver arrived at the dropoff location
  // the progress of user walking to pickup location // will be -1 if walking is not needed
  walkProgress: number;
  // the progress of the driver taking the student to the destination
  rideProgress: number;
  rideDuration: number;
  driverETA: number;
  onCancel: () => void;
  setFAQVisible: (visible: boolean) => void;
}

const HandleRideComponent: React.FC<HandleRideProps> = ({
  status,
  pickUpLocation,
  dropOffLocation,
  walkProgress,
  rideProgress,
  onCancel,
  rideDuration,
  driverETA,
  setFAQVisible,
}) => {
  // timer
  const [seconds, setSeconds] = useState(5 * 60); // 5 minutes

  // Function to format time (mm:ss)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  useEffect(() => {
    // if the status is not DriverArrived, clear the timer
    if (status !== "DriverArrived") return () => clearInterval(interval);
    // if the driver has arrived, show the timer
    const interval = setInterval(() => {
      setSeconds((prevSeconds) => prevSeconds - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (seconds <= 0) {
    // the timer ran out! cancel the ride
    onCancel();
  }

  let progress = 0;
  if (walkProgress > 0) {
    // change the walkProgress that was in the interval [0,1] ot [0,0.45]
    walkProgress = walkProgress * 0.45;
    // change the rideProgress that was in the interval [0,1] ot [0,0.55]
    rideProgress = rideProgress * 0.55;

    // the total progress is the sum of the walking and driving progress
    progress = walkProgress + rideProgress;
  } else {
    progress = rideProgress;
  }

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarTop}>
        <View style={styles.mainTextContainer}>
          {/* Figure out what title to show */}
          <Text style={styles.mainText}>
            {status == "RideCompleted"
              ? "You Have Arrived"
              : status == "DriverArrived"
                ? "Your Driver is Here"
                : status == "RideInProgress"
                  ? "You Are On Your Way"
                  : status == "DriverEnRoute"
                    ? "Your Driver Is En Route"
                    : "Waiting For Your Ride"}
          </Text>
          {/* FAQ button */}
          <TouchableOpacity onPress={() => setFAQVisible(true)}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="black"
              position="absolute"
              right={0}
            />
          </TouchableOpacity>
        </View>

        {/* Wait Time / Timer */}
        <View style={styles.subTextContainer}>
          {status !== "RideCompleted" && (
            <Ionicons name="time-outline" size={18} color="black" />
          )}
          <Text style={styles.subText}>
            {status == "RideCompleted"
              ? ""
              : status == "DriverArrived"
                ? formatTime(seconds)
                : status == "RideInProgress"
                  ? `Estimated Arrival Time: ${1}`
                  : `Estimated Wait Time: ${driverETA == 0 ? "<2" : driverETA} min`}
          </Text>
        </View>
      </View>
      {/* Progress Bar */}
      <View
        style={[
          styles.progressBarBottom,
          status == "WaitingForRide" || status == "DriverArrived"
            ? { borderBottomWidth: 2, borderBottomColor: "#EEEEEE" }
            : {},
        ]}
      >
        <Text style={styles.rideTimeText}>{rideDuration} min Ride</Text>
        <View style={styles.progressBarWrapper}>
          {walkProgress >= 0 && (
            <View style={[styles.circleStart, { backgroundColor: "white" }]} />
          )}
          <View
            style={[
              styles.circleStart,
              ...(walkProgress >= 0 ? [{ left: 130 }] : []),
            ]}
          />
          <ProgressBar
            progress={progress}
            color="#C5B4E3"
            style={styles.progressBar}
          />
          <View style={styles.circleEnd} />
        </View>

        <View style={styles.locationsContainer}>
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
      {/* Cancel Button */}
      {(status == "WaitingForRide" || status == "DriverEnRoute") && (
        <View
          style={[styles.bottomModalButtonContainer, { paddingHorizontal: 10 }]}
        >
          <Pressable
            style={[
              styles.bottomModalButton,
              {
                borderWidth: 2,
                borderColor: "red",
                backgroundColor: "white",
              },
            ]}
            onPress={onCancel}
          >
            <Text style={[styles.buttonText, { color: "red" }]}>
              Cancel Ride
            </Text>
          </Pressable>
        </View>
      )}
      {/* I Found My Driver Button */}
      {status == "DriverArrived" && (
        <View
          style={[styles.bottomModalButtonContainer, { paddingHorizontal: 10 }]}
        >
          <Pressable
            style={[
              styles.bottomModalButton,
              { borderWidth: 2, backgroundColor: "#4B2E83" },
            ]}
            onPress={onCancel}
          >
            <Text style={styles.buttonText}>I Found My Driver</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default HandleRideComponent;
