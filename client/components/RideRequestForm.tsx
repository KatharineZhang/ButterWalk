/* eslint-disable @typescript-eslint/no-require-imports */
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import AutocompleteInput from "./AutocompleteInput";
import { LocationName } from "../services/LocationService";
import { styles } from "../assets/styles";
import BottomDrawer from "./BottomDrawer";
import FAQ from "@/app/(student)/faq";
import PopUpModal from "./PopUpModal";

type RideRequestFormProps = {
  pickUpLocationChanged: (location: ValidLocationType) => void;
  dropOffLocationChanged: (location: ValidLocationType) => void;
  userLocation: { latitude: number; longitude: number };
  rideRequested: () => void;
};

// the type of locations we can send to homepage
export type ValidLocationType =
  | LocationName
  | `{latitude: ${number}, longitude: ${number}`;
// the type of locations we can show in the dropdown
export type DropDownType = LocationName | "Set location on map";

// What's in this component:
// Ride Request Form which sends request to server and gets response back,
// Cancel Ride button to cancel ride request,
// fuzzy search for location and desination which uses autocomplete(buggy),
// animation for rider icons,
// This is a beefy component!

export default function RideRequestForm({
  pickUpLocationChanged,
  dropOffLocationChanged,
  userLocation,
  rideRequested,
}: RideRequestFormProps) {
  // user input states for form
  const [location, setLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [numRiders, setNumRiders] = useState(1);
  const [message, setMessage] = useState("");

  // FAQ State
  const [FAQVisible, setFAQVisible] = useState(false);

  // Confirmation Modal
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);

  // the request button was clicked
  const handleSend = () => {
    if (location == "" || destination == "") {
      setMessage("Please specify a pickup and dropoff location!");
      return;
    }
    rideRequested();
  };

  /* FUZZY SEARCH BAR STUFF */

  // Autocomplete for Location and Destination
  const [locationQuery, setLocationQuery] = useState(""); // Location query
  const [destinationQuery, setDestinationQuery] = useState(""); // Destination query

  // data from LocationService.ts

  const data: DropDownType[] = [
    "Set location on map",
    "HUB",
    "Alder Hall",
    "Communication Building",
    "Flagpole",
    "Meany Hall",
    "IMA",
    "Okanogan Lane",
    "UW Tower",
  ];

  // check that does not allow location and destination to be the same
  const handleSetLocation = (value: DropDownType) => {
    if (value === destination) {
      alert("Pickup location and destination cannot be the same!");
      return;
    }
    if (value === "Set location on map") {
      console.log("here");
      setConfirmationModalVisible(true);
    } else {
      // we clicked a normal location
      setLocation(value);
      pickUpLocationChanged(value as LocationName);
    }
  };

  const handleSetDestination = (value: DropDownType) => {
    if (value === location) {
      alert("Pickup location and destination cannot be the same!");
      return;
    }
    if (value === "Set location on map") {
      console.log(
        "Something went wrong! can't set destination to user location"
      );
      return;
    }
    setDestination(value);
    dropOffLocationChanged(value as LocationName);
  };

  const confirmPickUpLocation = () => {
    console.log("RIDE REQ USER LOC:" + JSON.stringify(userLocation));
    setLocation(JSON.stringify(userLocation));
    pickUpLocationChanged(
      JSON.stringify(
        userLocation
      ) as `{latitude: ${number}, longitude: ${number}`
    );
    setConfirmationModalVisible(false);
  };

  /* FUZZY SEARCH BAR STUFF ENDS HERE */

  /* Animation stuffs */
  const fadeAnim = useState(new Animated.Value(0))[0];

  // animation functions
  const animateRiders = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle increase/decrease of riders
  const handleIncreaseRiders = () => {
    if (numRiders < 4) {
      setNumRiders(numRiders + 1);
      animateRiders();
    }
  };
  const handleDecreaseRiders = () => {
    if (numRiders > 1) {
      setNumRiders(numRiders - 1);
      animateRiders();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BottomDrawer modalVisible={confirmationModalVisible}>
        <View style={styles.formContainer}>
          <View>
            <Text style={styles.formHeader}>Request a Ride</Text>
            <View>
              {/* Location and Destination Autocomplete */}
              <View style={{ zIndex: 2 }}>
                <AutocompleteInput
                  query={locationQuery}
                  setQuery={setLocationQuery}
                  setSelection={handleSetLocation}
                  placeholder="Pick Up Location"
                  data={data}
                />
              </View>
              <View style={{ zIndex: 1 }}>
                <AutocompleteInput
                  query={destinationQuery}
                  setQuery={setDestinationQuery}
                  setSelection={handleSetDestination}
                  placeholder="Drop Off Location"
                  // can't set the user location as a destination
                  data={data.filter((item) => item !== "Set location on map")}
                />
              </View>
            </View>

            {/* Rider Selection Animation */}
            <View style={styles.animationContainer}>
              <View style={styles.riderContainer}>
                <View style={styles.iconRow}>
                  {/* Decrease Riders */}
                  <Pressable onPress={handleDecreaseRiders}>
                    <Ionicons name="remove" size={32} color="#4B2E83" />
                  </Pressable>

                  {/* Rider Icons with verlapping effect seen in figma */}
                  <View style={{ justifyContent: "center" }}>
                    <View style={styles.riderIconsContainer}>
                      {Array.from({ length: numRiders }).map((_, index) => (
                        <Animated.View
                          key={index}
                          style={[
                            styles.riderIcon,
                            { marginLeft: index === 0 ? 0 : -20 },
                          ]} // Adjust overlap
                        >
                          <Image
                            source={require("../assets/images/rider-icon.png")}
                            style={styles.riderImage}
                            resizeMode="contain"
                          />
                        </Animated.View>
                      ))}
                    </View>
                    <Text style={styles.riderCount}>
                      {numRiders} passenger(s)
                    </Text>
                  </View>
                  {/* Increase Riders */}
                  <Pressable onPress={handleIncreaseRiders}>
                    <Ionicons name="add" size={32} color="#4B2E83" />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Information Text */}
            <Text style={styles.infoText}>
              If the wait is too long, check out the NightRide shuttle! The
              service is available 6:30 p.m. – 2 a.m. daily except University
              Holidays. Extended service runs until 3:30 a.m. the week before
              and the week of finals.
            </Text>

            <Text style={{ color: "red" }}>{message}</Text>

            {/* Confirm Ride Button */}
            <Pressable onPress={handleSend} style={styles.sendButton}>
              <Text style={styles.buttonLabel}>Confirm Ride</Text>
            </Pressable>

            {/* faq button */}
            <TouchableOpacity
              style={{ position: "absolute", right: 10, top: 0 }}
              onPress={() => setFAQVisible(true)}
            >
              <Image
                source={require("@/assets/images/faq-button.png")}
                style={{ width: 20, height: 20 }}
              />
            </TouchableOpacity>

            {/* faq pop-up modal */}
            <FAQ isVisible={FAQVisible} onClose={() => setFAQVisible(false)} />

            {/* confirmation modal*/}
            <PopUpModal
              type="half"
              isVisible={confirmationModalVisible}
              onClose={() => setConfirmationModalVisible(false)}
              content={
                <View style={{ padding: 20 }}>
                  <Text style={styles.formHeader}>Confirm Pickup Location</Text>
                  <Text style={styles.description}>
                    Are you sure you want to set your pickup location to your
                    current location?
                  </Text>
                  <Pressable
                    onPress={confirmPickUpLocation}
                    style={styles.sendButton}
                  >
                    <Text style={styles.buttonLabel}>Confirm</Text>
                  </Pressable>
                </View>
              }
            />
          </View>
        </View>
      </BottomDrawer>
    </View>
  );
}
