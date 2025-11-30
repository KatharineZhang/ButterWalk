import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Linking,
  Modal,
  Platform,
  TouchableOpacity,
} from "react-native";
import { RideRequest } from "../../server/src/api";
import { NotificationType } from "./Both_Notification";
import Ionicons from "@expo/vector-icons/Ionicons";
import { styles } from "@/assets/styles";
import { ProgressBar } from "react-native-paper";
import openMap from "react-native-open-maps";

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
  makeCall: (phoneNumber: string) => void;

  // Progress tracking props
  pickupProgress: number;
  dropoffProgress: number;
  isNearPickup: boolean;
  isNearDropoff: boolean;
  studentPhoneNumber: string;
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
  requestInfo,
  driverToPickupDuration,
  pickupToDropoffDuration,
  pickupProgress,
  dropoffProgress,
  isNearPickup,
  isNearDropoff,
  studentPhoneNumber,
  makeCall,
  setPhase,
  changeFlaggingAllowed,
  completeRide,
  changeNotifState,
  onCancel,
  driverArrivedAtPickup,
  driverDrivingToDropOff,
  setStudentIsLate,
  updateSideBarHeight,
}: HandleRideProps) {
  // When timer is done in "waitingForPickup" state
  const [timerDone, setTimerDone] = useState(false);
  const [seconds, setSeconds] = useState(5 * 60); // 5 minutes
  // State for map selection modal
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<{
    lat: number;
    lng: number;
    title: string;
  } | null>(null);

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
        text: "Your ride will be canceled in one minute.",
        color: "#FFCBCB",
        boldText: "one minute",
        trigger: Date.now(),
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
      text: "Ride canceled",
      color: "#FFCBCB",
      trigger: Date.now(),
    });
    onCancel();
  };

  // Function to open map selection modal
  const showMapSelectionModal = (destination: {
    lat: number;
    lng: number;
    title: string;
  }) => {
    setSelectedDestination(destination);
    setShowMapModal(true);
  };

  // Function to open Google Maps
  const openGoogleMaps = async (destination: {
    lat: number;
    lng: number;
    title: string;
  }) => {
    try {
      // with this url, it will open in app if app is installed, else it will open in web browser
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
      await Linking.openURL(url);
    } catch (error) {
      console.error("Error opening Google Maps:", error);
    }
    setShowMapModal(false);
  };

  // Function to open Apple Maps (iOS only)
  const openAppleMaps = async (destination: {
    lat: number;
    lng: number;
    title: string;
  }) => {
    try {
      openMap({
        latitude: destination.lat,
        longitude: destination.lng,
        provider: Platform.OS === "ios" ? "apple" : "google",
        query: destination.title,
      });
    } catch (error) {
      console.error("Error opening Apple Maps:", error);
    }
    setShowMapModal(false);
  };

  // Function to open default map app (Android) (NOT TESTED)
  const openDefaultMaps = async (destination: {
    lat: number;
    lng: number;
    title: string;
  }) => {
    try {
      // Use geo, URI scheme which Android will route to default map app
      const url = `geo:${destination.lat},${destination.lng}?q=${destination.lat},${destination.lng}(${encodeURIComponent(destination.title)})`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to Google Maps if geo scheme is not available
        openGoogleMaps(destination);
      }
    } catch (error) {
      console.error("Error opening default maps:", error);
      // Fallback to Google Maps on error
      openGoogleMaps(destination);
    }
    setShowMapModal(false);
  };

  // Function to open google maps in web browser
  const openWebBrowser = async (destination: {
    lat: number;
    lng: number;
    title: string;
  }) => {
    try {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error("Cannot open maps URL");
      }
    } catch (error) {
      console.error("Error opening web browser:", error);
    }
    setShowMapModal(false);
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
              marginBottom: 6,
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
                  marginTop: 2,
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

          <View
            style={{
              marginTop: 4,
              marginBottom: 12,
              flexDirection: "row", // row layout
              alignItems: "center", // vertically align buttons
            }}
          >
            {/* Directions Button */}
            <Pressable
              style={{
                backgroundColor: "#4B2E83",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
              onPress={() => {
                const destination = {
                  lat:
                    requestInfo.locationFrom?.coordinates?.latitude || 47.6062,
                  lng:
                    requestInfo.locationFrom?.coordinates?.longitude ||
                    -122.3321,
                  title: "Pickup Location",
                };
                showMapSelectionModal(destination);
              }}
            >
              <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                Directions
              </Text>
            </Pressable>
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
                {/* Progress Bar */}
                <ProgressBar
                  progress={1}
                  color="#C5B4E3"
                  style={styles.progressBar}
                />
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
              {/* Button to cancel ride */}
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

          {/* Call Student Button (underneath) */}
          <View style={{ marginTop: 10 }}>
            <Pressable
              style={{
                backgroundColor: "#4B2E83",
                paddingVertical: 20,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => {
                makeCall(studentPhoneNumber);
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "400" }}>
                Call Student
              </Text>
            </Pressable>
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

          {/*Directions Button */}
          <View
            style={{
              marginTop: 4,
              marginBottom: 12,
            }}
          >
            <Pressable
              style={{
                backgroundColor: "#4B2E83",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                alignSelf: "flex-start",
              }}
              onPress={() => {
                const destination = {
                  lat: requestInfo.locationTo?.coordinates?.latitude || 47.6062,
                  lng:
                    requestInfo.locationTo?.coordinates?.longitude || -122.3321,
                  title: "Dropoff Location",
                };
                showMapSelectionModal(destination);
              }}
            >
              <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                Directions
              </Text>
            </Pressable>
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
                  style={styles.progressBar}
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

      {/* Map Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMapModal}
        onRequestClose={() => setShowMapModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
          activeOpacity={1}
          onPress={() => setShowMapModal(false)}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 20,
              paddingBottom: 40,
              paddingHorizontal: 20,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
                color: "#222",
              }}
            >
              Open Directions In
            </Text>

            {/* Google Maps Option */}
            <TouchableOpacity
              style={{
                backgroundColor: "#4B2E83",
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 12,
              }}
              onPress={() => {
                if (selectedDestination) {
                  openGoogleMaps(selectedDestination);
                }
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                Google Maps
              </Text>
            </TouchableOpacity>

            {/* Default Maps Option (Android only) */}
            {Platform.OS === "android" && (
              <TouchableOpacity
                style={{
                  backgroundColor: "#4B2E83",
                  paddingVertical: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  marginBottom: 12,
                }}
                onPress={() => {
                  if (selectedDestination) {
                    openDefaultMaps(selectedDestination);
                  }
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "600" }}
                >
                  Default Maps
                </Text>
              </TouchableOpacity>
            )}

            {/* Apple Maps Option (iOS only) */}
            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={{
                  backgroundColor: "#4B2E83",
                  paddingVertical: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  marginBottom: 12,
                }}
                onPress={() => {
                  if (selectedDestination) {
                    openAppleMaps(selectedDestination);
                  }
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "600" }}
                >
                  Apple Maps
                </Text>
              </TouchableOpacity>
            )}

            {/* Web Browser Option */}
            <TouchableOpacity
              style={{
                backgroundColor: "#E0E0E0",
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 12,
              }}
              onPress={() => {
                if (selectedDestination) {
                  openWebBrowser(selectedDestination);
                }
              }}
            >
              <Text style={{ color: "#222", fontSize: 16, fontWeight: "600" }}>
                Web Browser
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={{
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={() => setShowMapModal(false)}
            >
              <Text style={{ color: "#888", fontSize: 16, fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
