import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { styles } from "../assets/styles";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import momentTimezone from "moment-timezone";
import { NotificationType } from "./Both_Notification";
import Both_ProgressBar from "./Both_ProgressBar";

export type RideStatus =
  | "WaitingForRide" // the ride has been requested
  | "DriverEnRoute" // the ride is accepted
  | "DriverArrived" // the driver is at the pickup location
  | "RideInProgress" // the driver is taking the student to dropoff location
  | "RideCompleted"; // the driver arrived at the dropoff location

interface HandleRideProps {
  pickUpAddress: string;
  dropOffAddress: string;
  pickUpLocationName: string;
  dropOffLocationName: string;
  status: RideStatus;
  // the progress of user walking to pickup location // will be -1 if walking is not needed
  walkProgress: number;
  // the progress of the driver taking the student to the destination
  rideProgress: number;
  walkDuration: number;
  rideDuration: number;
  driverETA: number;
  onCancel: (reason: "button" | "timer") => void; // tell homepage to cancel the ride
  setFAQVisible: (visible: boolean) => void; // callback function to set the visibility of the FAQ modal
  setNotificationState: (state: NotificationType) => void; // show a notification to the user by calling this function
  goHome: () => void; // callback function to go back to the ride request form
  updateSideBarHeight: (height: number) => void; // callback function to update the height of the sidebar
}

const HandleRideComponent: React.FC<HandleRideProps> = ({
  status,
  pickUpAddress,
  dropOffAddress,
  pickUpLocationName,
  dropOffLocationName,
  walkProgress,
  rideProgress,
  walkDuration,
  rideDuration,
  driverETA,
  onCancel,
  setFAQVisible,
  setNotificationState,
  goHome,
  updateSideBarHeight,
}) => {
  // TIMER STUFF
  // keep track of the seconds left
  const [seconds, setSeconds] = useState(5 * 60); // 5 minutes

  // show the waiting for driver confirmation during pickup
  const [showWaitingForConfirmation, setShowWaitingForConfirmation] =
    useState(false);

  let progress = 0;

  // the actual countdown
  useEffect(() => {
    // when the status changes, reset the waiting for confirmation thing
    setShowWaitingForConfirmation(false);
    // if the status is not DriverArrived, clear the timer
    if (status !== "DriverArrived") {
      if (status == "DriverEnRoute") {
        setNotificationState({
          text: "Your driver is on their way!",
          color: "#C9FED0",
          trigger: Date.now(),
        });
      } else if (status == "RideCompleted") {
        setNotificationState({
          text: "You have arrived!",
          color: "#C9FED0",
          trigger: Date.now(),
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
      trigger: Date.now(),
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
        text: "Your ride will be canceled in one minute.",
        color: "#FFCBCB",
        boldText: "one minute",
        trigger: Date.now(),
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

  if (status == "RideInProgress") {
    // when ride is in progress
    // progress = 0.45 + (dist from driver+student to dropoff) / (dist from pickup to dropoff)
    const driving =
      rideProgress * 0.55 + // translated ride progress from 0 - 0.55
      0.45; // walking is done

    const newProgress = Math.max(progress, driving); // Make sure the progress bar always increases

    progress = Math.min(newProgress, 1); // Make sure the progress is not greater than 1
  } else if (status == "RideCompleted") {
    // When ride is completed
    // progress = 1
    progress = 1; // Make sure the progress is not greater than 1
  } else {
    // When ride is not in progress, the user can only walk to the pickup location
    // progress = (dist from user to pickup) / (dist from start to pickup)

    const walking = walkProgress * 0.45; // walk progress translated from 0 - 0.45
    const newProgress = Math.max(progress, walking); // Make sure the progress bar always increases

    // The max progress is 0.45
    progress = Math.min(newProgress, 0.45); // Make sure the progress is not greater than 0.45
  }

  return (
    <View
      style={styles.progressContainer}
      onLayout={(event) => {
        // on render, update the sidebar height to the height of this component
        updateSideBarHeight(event.nativeEvent.layout.height);
      }}
    >
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
              size={25}
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
                  : status == "WaitingForRide"
                    ? `${
                        driverETA == 0
                          ? "You are first in line!"
                          : driverETA == 1
                            ? "1 person ahead of you in line"
                            : driverETA + " people ahead of you in line"
                      }`
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
        <Both_ProgressBar
          rideStatus={
            status === "WaitingForRide"
              ? "start"
              : status === "DriverEnRoute" || status === "DriverArrived"
                ? "pickup"
                : "dropoff"
          }
          pickupAddress={pickUpAddress}
          dropoffAddress={dropOffAddress}
          pickUpLocationName={pickUpLocationName}
          dropOffLocationName={dropOffLocationName}
          driverToPickupMinutes={
            walkDuration > driverETA ? walkDuration : driverETA
          }
          pickupToDropoffMinutes={rideDuration}
        />
      </View>
      {/* Cancel Button */}
      {(status == "WaitingForRide" || status == "DriverEnRoute") && (
        <View
          style={[styles.bottomModalButtonContainer, { paddingHorizontal: 10 }]}
        >
          {/* Cancel Ride Button */}
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
            <Text
              style={[styles.buttonText, { color: "red", textAlign: "center" }]}
            >
              Cancel Ride
            </Text>
          </Pressable>
        </View>
      )}
      {/* I Found My Driver Button */}
      {status === "DriverArrived" &&
        (showWaitingForConfirmation === false ? (
          <View
            style={[
              styles.bottomModalButtonContainer,
              { paddingHorizontal: 10 },
            ]}
          >
            <Pressable
              style={[
                styles.bottomModalButton,
                { borderWidth: 2, backgroundColor: "#4B2E83" },
              ]}
              onPress={() => {
                setShowWaitingForConfirmation(true);
              }}
            >
              <Text style={styles.buttonText}>I Found My Driver</Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.bottomModalButtonContainer,
              {
                paddingHorizontal: 10,
                alignItems: "center",
                paddingVertical: "7%",
                flexDirection: "row",
                justifyContent: "center",
              },
            ]}
          >
            <ActivityIndicator
              size="small"
              color="#4B2E83"
              style={{ margin: "2%" }}
            />
            <Text style={{ fontStyle: "italic", fontSize: 18 }}>
              Waiting For Driver Confirmation...
            </Text>
          </View>
        ))}

      {/* I Found My Driver Button */}
      {status === "RideInProgress" &&
        (showWaitingForConfirmation === false ? (
          <View
            style={[
              styles.bottomModalButtonContainer,
              { paddingHorizontal: 10 },
            ]}
          >
            {/* I Have Arrived Button */}
            <Pressable
              style={[
                styles.bottomModalButton,
                { borderWidth: 2, backgroundColor: "#4B2E83" },
              ]}
              onPress={() => {
                setShowWaitingForConfirmation(true);
              }}
            >
              <Text style={[styles.buttonText, { textAlign: "center" }]}>
                I have arrived
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.bottomModalButtonContainer,
              {
                paddingHorizontal: 10,
                alignItems: "center",
                paddingVertical: "7%",
                flexDirection: "row",
                justifyContent: "center",
              },
            ]}
          >
            <ActivityIndicator
              size="small"
              color="#4B2E83"
              style={{ margin: "2%" }}
            />
            <Text style={{ fontStyle: "italic", fontSize: 18 }}>
              Waiting For Driver Confirmation...
            </Text>
          </View>
        ))}

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
