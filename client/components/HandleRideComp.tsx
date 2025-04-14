import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { styles } from "../assets/styles";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "react-native-paper";
import moment from "moment";
import momentTimezone from "moment-timezone";

export type RideStatus =
  | "WaitingForRide" // the ride has been requested
  | "DriverEnRoute" // the ride is accepted
  | "DriverArrived" // the driver is at the pickup location
  | "RideInProgress" // the driver is taking the student to dropoff location
  | "RideCompleted"; // the driver arrived at the dropoff location

interface HandleRideProps {
  pickUpLocation: string;
  dropOffLocation: string;
  pickUpAddress: string;
  dropOffAddress: string;
  status: RideStatus;
  // the progress of user walking to pickup location // will be -1 if walking is not needed
  walkProgress: number;
  // the progress of the driver taking the student to the destination
  rideProgress: number;
  walkDuration: number;
  rideDuration: number;
  driverETA: number;
  onCancel: (reason: "button" | "timer") => void;
  setFAQVisible: (visible: boolean) => void;
  openNavigation: () => void;
  setNotificationState: (state: {
    text: string;
    color: string;
    boldText?: string;
  }) => void;
  changeRideStatus: (status: RideStatus) => void;
  goHome: () => void;
}

const HandleRideComponent: React.FC<HandleRideProps> = ({
  status,
  pickUpLocation,
  dropOffLocation,
  pickUpAddress,
  dropOffAddress,
  walkProgress,
  rideProgress,
  walkDuration,
  onCancel,
  rideDuration,
  driverETA,
  setFAQVisible,
  openNavigation,
  setNotificationState,
  changeRideStatus,
  goHome,
}) => {
  // TIMER STUFF
  // keep track of the seconds left
  const [seconds, setSeconds] = useState(5 * 60); // 5 minutes
  // the actual countdown
  useEffect(() => {
    // if the status is not DriverArrived, clear the timer
    if (status !== "DriverArrived") {
      if (status == "DriverEnRoute") {
        setNotificationState({
          text: "Your driver is on their way!",
          color: "#C9FED0",
        });
      } else if (status == "RideCompleted") {
        setNotificationState({
          text: "You have arrived!",
          color: "#C9FED0",
        });
      }
      return () => clearInterval(interval);
    }
    // if the driver has arrived, show the timer

    // send the notification
    setNotificationState({
      text: "Your driver has arrived. You have 5 min to find your driver.",
      color: "#FFEFB4",
      boldText: "5 min",
    });

    // Update seconds every second
    const interval = setInterval(() => {
      setSeconds((prevSeconds) => prevSeconds - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (seconds == 60) {
      setNotificationState({
        text: "Your ride will be cancelled in one minute.",
        color: "#FFCBCB",
        boldText: "one minute",
      });
    } else if (seconds <= 0) {
      // the timer ran out! cancel the ride
      onCancel("timer");
    }
  }, [seconds]);

  // Function to format time (mm:ss)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  let progress = 0;
  if (walkProgress >= 0) {
    // change the walkProgress that was in the interval [0,1] ot [0,0.45]
    walkProgress = walkProgress * 0.45;
    // change the rideProgress that was in the interval [0,1] ot [0,0.55]
    rideProgress = rideProgress * 0.55;

    // the total progress is the sum of the walking and driving progress
    progress = walkProgress + rideProgress;
  } else {
    progress = rideProgress;
  }
  progress = Math.min(progress, 1); // make sure the progress is not greater than 1
  console.log("progress", progress);

  // height expansion
  const [expanded, setExpanded] = useState(false); // if the progress bar is expanded or not

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
        {status !== "RideCompleted" && (
          <View style={styles.subTextContainer}>
            <Ionicons name="time-outline" size={18} color="black" />
            <Text style={styles.subText}>
              {status == "DriverArrived"
                ? formatTime(seconds)
                : status == "RideInProgress"
                  ? // convert the arrival time to our best guess of the user's timezone
                    `Estimated Arrival Time: ${momentTimezone.tz(moment().add(rideDuration, "minutes"), moment.tz.guess()).format("h:mm A")}`
                  : `Estimated Wait Time: ${driverETA == 0 ? "<2" : driverETA} min`}
            </Text>
          </View>
        )}
      </View>
      {/* Progress Bar Top Labels */}
      <View
        style={[
          styles.progressBarBottom,
          status == "WaitingForRide" || status == "DriverArrived"
            ? { borderBottomWidth: 2, borderBottomColor: "#EEEEEE" }
            : {},
        ]}
      >
        {/* If walking is needed show Walk and Ride Duration*/}
        {walkProgress >= 0 ? (
          <View style={{ flexDirection: "row", paddingBottom: 10 }}>
            {/* Open walking directions in native maps */}
            <TouchableOpacity onPress={openNavigation}>
              <View style={{ height: 12 }} />
              <Text
                style={{
                  alignSelf: "baseline",
                  fontSize: 12,
                  fontWeight: "bold",
                  textDecorationLine: "underline",
                }}
              >
                {walkDuration} min Walk
              </Text>
            </TouchableOpacity>
            <View style={{ width: 100 }} />
            {/* Descriptor above the progress bar __ min Ride */}
            <View
              style={{
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                left: -20,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {rideDuration} min Ride
              </Text>
              {/* Show more or less details about the ride */}
              <Pressable onPress={() => setExpanded(!expanded)}>
                <Text
                  style={[
                    styles.locationText,
                    { textDecorationLine: "underline" },
                  ]}
                >
                  {expanded ? "(Less Details)" : "(More Details)"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Else, only show ride duration*/}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {rideDuration} min Ride
            </Text>
            {/* Show more or less details about the ride */}
            <Pressable onPress={() => setExpanded(!expanded)}>
              <Text
                style={[
                  styles.locationText,
                  { textDecorationLine: "underline" },
                ]}
              >
                {expanded ? "(Less Details)" : "(More Details)"}
              </Text>
            </Pressable>
            <View style={{ height: 10 }} />
          </View>
        )}
        {/* Actual Progress Bar */}
        <View style={styles.progressBarWrapper}>
          {/* show white circle if walking needed */}
          {walkProgress >= 0 && (
            <View style={[styles.circleStart, { backgroundColor: "white" }]} />
          )}
          {/* move purple circle to middle if walking needed */}
          <View
            style={[
              styles.circleStart,
              ...(walkProgress >= 0 ? [{ left: 130 }] : []),
            ]}
          />
          {/* Progress Bar */}
          <ProgressBar
            progress={progress}
            color="#C5B4E3"
            style={styles.progressBar}
          />
          <View style={styles.circleEnd} />
        </View>

        {/* Locations Text */}
        <View style={styles.locationsContainer}>
          {/* If walking is needed, show Start and Pickup Location */}
          {walkProgress >= 0 ? (
            <View style={{ flexDirection: "row", maxWidth: "50%" }}>
              <View style={{ alignSelf: "flex-start" }}>
                <Text style={styles.locationTitle}>Start</Text>
              </View>
              <View
                style={{
                  left: 60,
                  width: 100,
                  alignItems: "center",
                }}
              >
                <Text style={styles.locationTitle}>Pickup</Text>
                {/* If expanded, show location name and address */}
                {expanded && (
                  <View style={{ alignItems: "center" }}>
                    <Text
                      style={[styles.locationSubtitle, { textAlign: "center" }]}
                    >
                      {pickUpLocation}
                    </Text>
                    <Text style={{ fontSize: 10, textAlign: "center" }}>
                      {pickUpAddress}21qz
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.pickUpContainer}>
              {/* Else just show Pickup Location */}
              <Text style={styles.locationTitle}>Pickup</Text>
              {/* If expanded, show location name and address */}
              {expanded && (
                <View>
                  <Text style={styles.locationSubtitle}>{pickUpLocation}</Text>
                  <Text style={{ fontSize: 10, marginBottom: 5 }}>
                    {pickUpAddress}
                  </Text>
                </View>
              )}
            </View>
          )}
          {/* Dropoff Location */}
          <View
            style={[
              styles.dropOffContainer,
              walkProgress >= 0 ? { maxWidth: "30%" } : {},
            ]}
          >
            <Text style={styles.locationTitle}>Dropoff</Text>
            {expanded && (
              <View style={{ alignItems: "flex-end" }}>
                {/* If expanded, show location name and address */}
                <Text style={[styles.locationSubtitle, { textAlign: "right" }]}>
                  {dropOffLocation}
                </Text>
                <Text
                  style={{ fontSize: 10, marginBottom: 5, textAlign: "right" }}
                >
                  {dropOffAddress}
                </Text>
              </View>
            )}
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
            onPress={() => onCancel("button")}
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
            onPress={() => {
              changeRideStatus("RideInProgress");
            }}
          >
            <Text style={styles.buttonText}>I Found My Driver</Text>
          </Pressable>
        </View>
      )}
      {/* Go Home Button */}
      {status == "RideCompleted" && (
        <View
          style={[styles.bottomModalButtonContainer, { paddingHorizontal: 10 }]}
        >
          <Pressable
            style={[
              styles.bottomModalButton,
              { borderWidth: 2, backgroundColor: "#4B2E83" },
            ]}
            onPress={goHome}
          >
            <Text style={styles.buttonText}>Back To HomePage</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default HandleRideComponent;
