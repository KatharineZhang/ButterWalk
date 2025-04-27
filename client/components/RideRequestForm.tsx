/* eslint-disable @typescript-eslint/no-require-imports */
import { useEffect, useRef, useState } from "react";
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
import PopUpModal from "./PopUpModal";
import BottomSheet from "@gorhom/bottom-sheet";
import { ScrollView } from "react-native-gesture-handler";
import SegmentedProgressBar from "./SegmentedProgressBar";

type RideRequestFormProps = {
  pickUpLocationChanged: (location: ValidLocationType) => void;
  dropOffLocationChanged: (location: ValidLocationType) => void;
  userLocation: { latitude: number; longitude: number };
  rideRequested: (numPassengers: number) => void;
  setFAQVisible: (visible: boolean) => void;
  startingState?: { pickup: string; dropoff: string; numRiders: number };
};

// the type of locations we can send to homepage
export type ValidLocationType = LocationName | `Current Location`;
// the type of locations we can show in the dropdown
export type DropDownType = LocationName | "Current Location";

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
  startingState,
  setFAQVisible,
}: RideRequestFormProps) {
  // user input states for form
  const [location, setLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [numRiders, setNumRiders] = useState(1);

  const [showNumberRiders, setShowNumberRiders] = useState(false);

  // Bottom Sheet Reference needed to expand the bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (startingState) {
      setLocationQuery(startingState.pickup);
      setLocation(startingState.pickup);
      setDestinationQuery(startingState.dropoff);
      setDestination(startingState.dropoff);
      setNumRiders(startingState.numRiders);
      // show the number of riders modal
      setShowNumberRiders(true);
    }
  }, []);

  // Confirmation Modal
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);

  //
  const goToNumberRiders = () => {
    if (location == "" || destination == "") {
      alert("Please specify a pickup and dropoff location!");
      return;
    }
    setShowNumberRiders(true);
  };

  /* FUZZY SEARCH BAR STUFF */

  // Autocomplete for Location and Destination
  const [locationQuery, setLocationQuery] = useState(""); // Location query
  const [destinationQuery, setDestinationQuery] = useState(""); // Destination query

  const [currentQuery, setCurrentQuery] = useState<"pickup" | "dropoff">(
    "pickup"
  );

  // data from LocationService.ts

  const data: DropDownType[] = [
    "Current Location",
    "HUB",
    "Alder Hall",
    "Communication Building",
    "Flagpole",
    "Meany Hall",
    "IMA",
    "Okanogan Lane",
    "UW Tower",
    "Suzallo",
    "Allen South",
  ];

  const handleSelection = (value: DropDownType) => {
    if (currentQuery === "pickup") {
      setLocationQuery(value);
      handleSetLocation(value);
      //switch to dropoff
      setCurrentQuery("dropoff");
    } else {
      setDestinationQuery(value);
      handleSetDestination(value);
    }
  };

  // check that does not allow location and destination to be the same
  const handleSetLocation = (value: DropDownType) => {
    if (value === destination) {
      alert("Pickup location and destination cannot be the same!");
      return;
    }
    if (value === "Current Location") {
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
    if (value === "Current Location") {
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
    pickUpLocationChanged("Current Location");
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

  // expand the bottom sheet
  const expand = () => {
    if (bottomSheetRef == null) {
      console.log("bottomSheetRef is null");
      return;
    }
    bottomSheetRef.current?.expand();
  };

  const RideRequest: JSX.Element = (
    <View style={{ flex: 1, pointerEvents: "box-none" }}>
      <BottomDrawer bottomSheetRef={bottomSheetRef}>
        <View style={styles.requestFormContainer}>
          <View>
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "90%",
                marginHorizontal: 20,
              }}
            >
              <View style={{ width: 20 }} />
              {/* Title */}
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                Choose Your Locations
              </Text>

              {/* faq button */}
              <TouchableOpacity onPress={() => setFAQVisible(true)}>
                <Ionicons
                  name="information-circle-outline"
                  size={25}
                  color="black"
                />
              </TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
            <SegmentedProgressBar type={1} />
            <View style={{ height: 20 }} />

            {/* Location and Destination Icons */}
            <View
              style={{
                borderRadius: 13,
                backgroundColor: "#4B2E83",
                position: "absolute",
                zIndex: 3,
                top: 90,
                left: 13,
                height: 15,
                width: 15,
              }}
            />
            <Image
              source={require("@/assets/images/dashed-line.png")}
              style={{
                zIndex: 3,
                position: "absolute",
                top: 112,
                left: 19,
                width: 2,
                height: 40,
              }}
            />
            <Image
              source={require("@/assets/images/dropoff-location.png")}
              style={{
                position: "absolute",
                zIndex: 3,
                top: 157,
                left: 10,
                height: 20,
                width: 20,
              }}
            />
            <View
              style={{
                zIndex: 2,
              }}
            >
              {/* Location and Destination Inputs */}
              <AutocompleteInput
                onPress={() => {
                  setCurrentQuery("pickup");
                  expand();
                }}
                query={locationQuery}
                setQuery={setLocationQuery}
                placeholder="Pick Up Location"
                data={data}
              />
              <AutocompleteInput
                onPress={() => {
                  setCurrentQuery("dropoff");
                  expand();
                }}
                query={destinationQuery}
                setQuery={setDestinationQuery}
                placeholder="Drop Off Location"
                data={data}
              />
            </View>

            {/* Next Button */}
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "flex-end",
              }}
            >
              <Text style={{ fontStyle: "italic" }}>
                Choose # of passengers
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={goToNumberRiders}
              >
                <Ionicons name="arrow-forward" size={30} color="#4B2E83" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Autocomplete Suggestions */}
        <View style={{ flex: 1, height: 100 }}>
          <ScrollView style={{ paddingBottom: 400 }}>
            {data
              .filter((item) => {
                if (currentQuery == "dropoff") {
                  return item !== "Current Location";
                } else {
                  return true;
                }
              })
              .filter(
                (item) =>
                  item
                    .toLowerCase()
                    .includes(
                      currentQuery == "pickup"
                        ? locationQuery.toLowerCase()
                        : destinationQuery
                    ) ||
                  (currentQuery == "pickup" && item == "Current Location")
              )
              .map((item) => (
                <TouchableOpacity
                  onPress={() => handleSelection(item)}
                  key={item}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#ccc",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("@/assets/images/dropdown-location.png")}
                    style={{ width: 35, height: 35 }}
                  />
                  <View style={{ width: 10 }} />
                  <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </BottomDrawer>
      {/* confirmation modal TODO: REMOVE???*/}
      <PopUpModal
        type="half"
        isVisible={confirmationModalVisible}
        onClose={() => setConfirmationModalVisible(false)}
        content={
          <View style={{ padding: 20 }}>
            <Text style={styles.formHeader}>Confirm Pickup Location</Text>
            <Text style={styles.description}>
              Are you sure you want to set your pickup location to your current
              location?
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
  );

  const NumberRiders: JSX.Element = (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: "white",
        padding: 16,
        borderRadius: 10,
      }}
    >
      <View style={{ height: 5 }} />
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginHorizontal: 20,
        }}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => setShowNumberRiders(false)}>
          <Ionicons name="arrow-back" size={30} color="#4B2E83" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
          Confirm Passengers
        </Text>

        {/* faq button */}
        <TouchableOpacity onPress={() => setFAQVisible(true)}>
          <Ionicons name="information-circle-outline" size={25} color="black" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
      <SegmentedProgressBar type={2} />
      <View style={{ height: 20 }} />

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
              <Text style={styles.riderCount}>{numRiders} passenger(s)</Text>
            </View>
            {/* Increase Riders */}
            <Pressable onPress={handleIncreaseRiders}>
              <Ionicons name="add" size={32} color="#4B2E83" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Next Button */}
      <View
        style={{
          paddingVertical: 10,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <Text style={{ fontStyle: "italic" }}>See ride details</Text>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={() => rideRequested(numRiders)}
        >
          <Ionicons name="arrow-forward" size={30} color="#4B2E83" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return showNumberRiders ? NumberRiders : RideRequest;
}
