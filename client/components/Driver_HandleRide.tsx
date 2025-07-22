import { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { RideRequest } from "../../server/src/api";
import { NotificationType } from "./Both_Notification";
import Ionicons from "@expo/vector-icons/Ionicons";
import { styles } from "@/assets/styles";
import { ProgressBar } from "react-native-paper";

interface HandleRideProps {
  requestInfo: RideRequest;
  driverToPickupDuration: number; // in minutes, might be undefined initially
  pickupToDropoffDuration: number; // in minutes, might be undefined initially
  phase:
    | "headingToPickup"
    | "waitingForPickup"
    | "headingToDropoff"
    | "arrivedAtDropoff";
  changeFlaggingAllowed: (allowed: boolean) => void;
  completeRide: () => void;
  changeNotifState: (notif: NotificationType) => void;
  onCancel: () => void;
  setPhase: (
    phase:
      | "headingToPickup"
      | "waitingForPickup"
      | "headingToDropoff"
      | "arrivedAtDropoff"
  ) => void;
  driverArrivedAtPickup: () => void;
  driverDrivingToDropOff: () => void;
  setStudentIsLate: (isLate: boolean) => void; // callback to set student late state

  // Progress tracking props
  pickupProgress: number;
  dropoffProgress: number;
  isNearPickup: boolean;
  isNearDropoff: boolean;
  updateSideBarHeight: (height: number) => void;
}

// a helper function that adds location labels below the progress bar
function ProgressBarLabels() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        width: 320,
        alignSelf: "center",
        marginTop: 15,
      }}
    >
      <Text style={styles.locationTitle}>Start</Text>
      <Text style={styles.locationTitle}>Pickup</Text>
      <Text style={styles.locationTitle}>Dropoff</Text>
    </View>
  );
}

// a helper function that adds top labels above the progress bar to show ETA
// to the pickup and dropoff locations
function ProgressBarTopLabels({
  driverToPickupDuration,
  pickupToDropoffDuration,
}: {
  driverToPickupDuration: number;
  pickupToDropoffDuration: number;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        width: 320, // match your progressBarWrapper width
        alignSelf: "center",
        marginBottom: 4,
      }}
    >
      {/* Left label: driver to pickup */}
      <View style={{ width: 130, alignItems: "center" }}>
        <Text style={{ fontSize: 12, fontWeight: "bold" }}>
          {driverToPickupDuration} min
        </Text>
      </View>
      {/* Right label: pickup to dropoff */}
      <View style={{ width: 130, alignItems: "center" }}>
        <Text style={{ fontSize: 12, fontWeight: "bold" }}>
          {pickupToDropoffDuration} min
        </Text>
      </View>
    </View>
  );
}

export default function HandleRide({
  phase,
  setPhase,
  requestInfo,
  driverToPickupDuration,
  pickupToDropoffDuration,
  changeFlaggingAllowed,
  completeRide,
  changeNotifState,
  onCancel,
  driverArrivedAtPickup,
  driverDrivingToDropOff,
  setStudentIsLate,
  pickupProgress,
  dropoffProgress,
  isNearPickup,
  isNearDropoff,
  updateSideBarHeight,
}: HandleRideProps) {
  // When timer is done in "waitingForPickup" state
  const [timerDone, setTimerDone] = useState(false);
  const [seconds, setSeconds] = useState(5 * 60); // 5 minutes

  useEffect(() => {
    if (phase === "headingToPickup") {
      changeFlaggingAllowed(false);
    } else if (phase === "waitingForPickup") {
      // Reset timer when entering waitingForPickup phase, 5 min
      setSeconds(5 * 60);
      setTimerDone(false);
      // Update seconds every second
      const interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds <= 0) {
            return 0; // Stop at 0
          }
          return prevSeconds - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (phase === "headingToDropoff" || phase === "arrivedAtDropoff") {
      setStudentIsLate(false);
    }
  }, [phase]);

  // Automatically change to arrivedAtDropoff phase when near dropoff
  useEffect(() => {
    if (phase === "headingToDropoff" && isNearDropoff) {
      setPhase("arrivedAtDropoff");
    }
  }, [phase, isNearDropoff, setPhase]);

  useEffect(() => {
    if (seconds == 60) {
      changeNotifState({
        text: "Your ride will be cancelled in one minute.",
        color: "#FFCBCB",
        boldText: "one minute",
      });
    } else if (seconds <= 0) {
      // the timer ran out! cancel the ride
      setTimerDone(true);
      changeFlaggingAllowed(true);
      setStudentIsLate(true);
    }
  }, [seconds]);

  const cancelRide = () => {
    changeNotifState({
      text: "Ride cancelled",
      color: "#FF0000",
    });
    onCancel();
  };

  // Function to format time (mm:ss)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  // Calculate combined progress for the bar
  let progress = 0;
  // Ensure progress values are within the range [0, 1]
  const validatedPickupProgress = Math.min(Math.max(pickupProgress, 0), 1);
  const validatedDropoffProgress = Math.min(Math.max(dropoffProgress, 0), 1);

  if (phase === "headingToPickup" || phase === "waitingForPickup") {
    // Progress ranges from 0 to 0.45 during pickup phase
    progress = validatedPickupProgress * 0.45;
  } else if (phase === "headingToDropoff") {
    // Progress ranges from 0.45 to 1 during dropoff phase
    progress = 0.45 + validatedDropoffProgress * 0.45;
  } else if (phase === "arrivedAtDropoff") {
    // Full progress when arrived at dropoff
    progress = 1;
  }

  return (
    <View
      style={[
        {
          // position absolute here for now, otherwise styling of other
          //components in home get messed up
          position: "absolute",
          bottom: 0,
          width: "100%",
          backgroundColor: "white",
          paddingHorizontal: 16,
          borderRadius: 10,
          paddingVertical: "8%",
          paddingBottom:
            phase === "waitingForPickup" || phase === "arrivedAtDropoff"
              ? 40
              : "15%",
        },
      ]}
      onLayout={(event) => {
        updateSideBarHeight(event.nativeEvent.layout.height);
      }}
    >
      {phase === "headingToPickup" ? (
        <>
          {/* title and passenger name */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 26, fontWeight: "bold", color: "#222" }}>
              Driving to Pickup
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#222" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              {/* Person icon and number of passengers */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Ionicons name="person" size={20} color="#888888" />
                <Text
                  style={{
                    fontSize: 16,
                    marginLeft: 6,
                    color: "#888888",
                    fontWeight: "500",
                  }}
                >
                  ({requestInfo?.numRiders})
                </Text>
              </View>
            </View>
          </View>
          {/* Grey line */}
          <View style={styles.driverGreyLine} />
          {/* Progress Bar */}
          <ProgressBarTopLabels
            driverToPickupDuration={driverToPickupDuration}
            pickupToDropoffDuration={pickupToDropoffDuration}
          />
          <View style={{ width: "100%", alignItems: "center" }}>
            <View style={styles.progressBarWrapper}>
              {/* show white circle */}
              <View
                style={[styles.circleStart, { backgroundColor: "white" }]}
              />
              {/* move purple circle to middle */}
              <View style={[styles.circleStart, { left: 130 }]} />
              {/* Progress Bar */}
              <ProgressBar
                progress={progress}
                color="#C5B4E3"
                style={styles.progressBar}
              />
              <View style={styles.circleEnd} />
            </View>
          </View>
          <ProgressBarLabels />
          {/* If proximity to pickup location is near, 
          panel grows and button to confirm pickup shows */}
          {isNearPickup && (
            <View
              style={{
                paddingTop: "10%",
                alignContent: "center",
              }}
            >
              <Pressable
                style={{
                  backgroundColor: "#4B2E83",
                  paddingVertical: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => {
                  // call the callback to move onto next phase
                  setPhase("waitingForPickup");
                  driverArrivedAtPickup();
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "600" }}
                >
                  I'm at pickup location
                </Text>
              </Pressable>
            </View>
          )}
        </>
      ) : phase === "waitingForPickup" ? (
        <>
          {/* Title and passenger name */}
          <View style={styles.titlePassengerName}>
            <View style={{ flexDirection: "column" }}>
              <Text style={{ fontSize: 26, fontWeight: "bold", color: "#222" }}>
                Waiting to Pickup
              </Text>
              {/* Timer */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                {/* changes to red after countdown reaches 0 */}
                <Ionicons
                  name="time-outline"
                  size={26}
                  color={seconds <= 0 ? "#FF0000" : "#4B2E83"}
                />
                <Text
                  style={{
                    fontSize: 26,
                    marginLeft: 8,
                    color: seconds <= 0 ? "#FF0000" : "#4B2E83",
                    fontWeight: "bold",
                  }}
                >
                  {formatTime(seconds)}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", marginTop: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#222" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              {/* Person icon and number of passengers */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: "15%",
                }}
              >
                <Ionicons name="person" size={20} color="#888888" />
                <Text
                  style={{
                    fontSize: 16,
                    marginLeft: 6,
                    color: "#888888",
                    fontWeight: "500",
                  }}
                >
                  ({requestInfo?.numRiders})
                </Text>
              </View>
            </View>
          </View>
          {/* Grey line */}
          <View
            style={{
              height: 1,
              backgroundColor: "#E0E0E0",
              marginVertical: 16,
            }}
          />
          {/* Actual Progress Bar */}
          <View style={styles.progressBarTop}>
            <ProgressBarTopLabels
              driverToPickupDuration={driverToPickupDuration}
              pickupToDropoffDuration={pickupToDropoffDuration}
            />
            <View style={{ width: "100%", alignItems: "center" }}>
              <View style={styles.progressBarWrapper}>
                {/* show white circle */}
                <View
                  style={[styles.circleStart, { backgroundColor: "white" }]}
                />
                {/* move purple circle to middle (hardcoded like student side) */}
                <View style={[styles.circleStart, { left: 130 }]} />
                {/* using flex styling for this progress bar throws an error for some reason? */}
                <View
                  style={{
                    width: 320,
                    height: 15,
                    backgroundColor: "#E3E3E3",
                    borderRadius: 6,
                    overflow: "hidden",
                    flexDirection: "row",
                  }}
                >
                  <View
                    style={{
                      width: 160,
                      height: 15,
                      backgroundColor: "#C5B4E3",
                    }}
                  />
                </View>
                <View style={styles.circleEnd} />
              </View>
            </View>
            <ProgressBarLabels />
          </View>
          {/* Two buttons side by side */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: "5%",
              paddingBottom: 20,
            }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              {/* Button to confirm student was picked up */}
              <Pressable
                style={{
                  backgroundColor: "#4B2E83",
                  paddingVertical: 20,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => {
                  // call the callback to update the state
                  setPhase("headingToDropoff");
                  driverDrivingToDropOff();
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "400" }}
                >
                  I've found student
                </Text>
              </Pressable>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              {/* Button to cancel ride, turns red and clickable after 5 min counter */}
              <Pressable
                style={{
                  backgroundColor: seconds <= 0 ? "#FF0000" : "#E0E0E0",
                  ...styles.driverCancelButton,
                }}
                onPress={timerDone ? cancelRide : onCancel}
              >
                <Text
                  style={{
                    color: seconds <= 0 ? "white" : "black",
                    fontSize: 16,
                    fontWeight: "400",
                  }}
                >
                  Cancel request
                </Text>
              </Pressable>
            </View>
          </View>
        </>
      ) : phase === "headingToDropoff" ? (
        <>
          {/* title and passenger name */}
          <View style={styles.titlePassengerName}>
            <Text style={{ fontSize: 26, fontWeight: "bold", color: "#222" }}>
              Driving to Dropoff
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#222" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              {/* Person icon and number of passengers */}
              <View style={styles.driverPersonIcon}>
                <Ionicons name="person" size={20} color="#888888" />
                <Text
                  style={{
                    fontSize: 16,
                    marginLeft: 6,
                    color: "#888888",
                    fontWeight: "500",
                  }}
                >
                  ({requestInfo?.numRiders})
                </Text>
              </View>
            </View>
          </View>
          {/* Grey line */}
          <View style={styles.driverGreyLine} />
          {/* Progress Bar */}
          <ProgressBarTopLabels
            driverToPickupDuration={driverToPickupDuration}
            pickupToDropoffDuration={pickupToDropoffDuration}
          />
          <View style={{ width: "100%", alignItems: "center" }}>
            <View style={styles.progressBarWrapper}>
              {/* show white circle */}
              <View
                style={[styles.circleStart, { backgroundColor: "white" }]}
              />
              {/* move purple circle to middle */}
              <View style={[styles.circleStart, { left: 130 }]} />
              {/* Progress Bar */}
              <ProgressBar
                progress={progress}
                color="#C5B4E3"
                style={styles.progressBar}
              />
              <View style={styles.circleEnd} />
            </View>
          </View>
          <ProgressBarLabels />
        </>
      ) : phase === "arrivedAtDropoff" ? (
        <>
          {/* title and passenger name */}
          <View style={styles.titlePassengerName}>
            <Text style={{ fontSize: 26, fontWeight: "bold", color: "#222" }}>
              You've Arrived
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: "#222" }}>
                {requestInfo?.netid || "Passenger"}
              </Text>
              {/* Person icon and number of passengers */}
              <View style={styles.driverPersonIcon}>
                <Ionicons name="person" size={20} color="#888888" />
                <Text
                  style={{
                    fontSize: 16,
                    marginLeft: 6,
                    color: "#888888",
                    fontWeight: "500",
                  }}
                >
                  ({requestInfo?.numRiders})
                </Text>
              </View>
            </View>
          </View>
          {/* Progress Bar Section */}
          <View style={styles.progressBarTop}>
            <ProgressBarTopLabels
              driverToPickupDuration={driverToPickupDuration}
              pickupToDropoffDuration={pickupToDropoffDuration}
            />
            <View style={{ width: "100%", alignItems: "center" }}>
              <View style={styles.progressBarWrapper}>
                <View
                  style={[styles.circleStart, { backgroundColor: "white" }]}
                />
                <View style={[styles.circleStart, { left: 130 }]} />
                <ProgressBar
                  progress={1}
                  color="#C5B4E3"
                  style={{ width: 320, height: 15, backgroundColor: "#E3E3E3" }}
                />
                <View style={styles.circleEnd} />
              </View>
            </View>
            <ProgressBarLabels />
          </View>
          {/* Grey line */}
          <Pressable
            style={[styles.driverCompleteButton, { marginTop: "2%" }]}
            onPress={completeRide}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              I've dropped off student
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
