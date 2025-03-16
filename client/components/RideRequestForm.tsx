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
import FAQ from "@/app/(student)/faq";
import PopUpModal from "./PopUpModal";
import BottomSheet from "@gorhom/bottom-sheet";
import { ScrollView } from "react-native-gesture-handler";

type RideRequestFormProps = {
  pickUpLocationChanged: (location: ValidLocationType) => void;
  dropOffLocationChanged: (location: ValidLocationType) => void;
  userLocation: { latitude: number; longitude: number };
  rideRequested: (numPassengers: number) => void;
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
}: RideRequestFormProps) {
  // user input states for form
  const [location, setLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [numRiders, setNumRiders] = useState(1);

  // Bottom Sheet Reference needed to expand the bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (startingState) {
      setLocationQuery(startingState.pickup);
      setLocation(startingState.pickup);
      setDestinationQuery(startingState.dropoff);
      setDestination(startingState.dropoff);
      setNumRiders(startingState.numRiders);
    }
  }, []);

  // FAQ State
  const [FAQVisible, setFAQVisible] = useState(false);

  // Confirmation Modal
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);

  // the request button was clicked
  const handleSend = () => {
    if (location == "" || destination == "") {
      alert("Please specify a pickup and dropoff location!");
      return;
    }
    rideRequested(numRiders);
  };

  /* FUZZY SEARCH BAR STUFF */

  // Autocomplete for Location and Destination
  const [locationQuery, setLocationQuery] = useState(""); // Location query
  const [destinationQuery, setDestinationQuery] = useState(""); // Destination query

  // data from LocationService.ts

  const [data, setData] = useState<DropDownType[]>([
    "Current Location",
    "HUB",
    "Alder Hall",
    "Communication Building",
    "Flagpole",
    "Meany Hall",
    "IMA",
    "Okanogan Lane",
    "UW Tower",
  ]);

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

  const handleFilterData = (query: string) => {
    setData(data.filter(
      (item) =>
        item.toLowerCase().includes(query.toLowerCase()) ||
        item === "Current Location"
    ));
  }

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

  return (
    <View style={{ flex: 1 }}>
      <BottomDrawer bottomSheetRef={bottomSheetRef}>
        <View style={styles.formContainer}>
          <View>
            {/* faq button */}
            <TouchableOpacity
              style={{ position: "absolute", right: 10, top: -10 }}
              onPress={() => setFAQVisible(true)}
            >
              <Image
                source={require("@/assets/images/faq-button.png")}
                style={{ width: 20, height: 20 }}
              />
            </TouchableOpacity>
            <View style={{ height: 20 }} />

            {/* Location and Destination Icons */}
            <Image
              source={require("@/assets/images/confirm-pickup-location.png")}
              style={{
                position: "absolute",
                zIndex: 3,
                top: 40,
                left: 10,
                height: 20,
                width: 20,
              }}
            />
            <Image
              source={require("@/assets/images/confirm-line.png")}
              style={{
                zIndex: 3,
                position: "absolute",
                top: 65,
                left: 19,
                width: 2,
                height: 40,
              }}
            />
            <Image
              source={require("@/assets/images/confirm-dropoff-location.png")}
              style={{
                position: "absolute",
                zIndex: 3,
                top: 110,
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
                onPress={() => bottomSheetRef.current?.expand()}
                query={locationQuery}
                setQuery={setLocationQuery}
                setSelection={handleSetLocation}
                placeholder="Pick Up Location"
                data={data}
              />
              <AutocompleteInput
                onPress={expand}
                query={destinationQuery}
                setQuery={setDestinationQuery}
                setSelection={handleSetDestination}
                placeholder="Drop Off Location"
                // can't set the user location as a destination
                data={data.filter((item) => item !== "Current Location")}
              />
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

            {/* Next Button */}
            <View
              style={{
                paddingVertical: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "flex-end",
              }}
            >
              <Text style={{ fontStyle: "italic" }}>
                Review and Confirm Your Ride
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleSend}
              >
                <Image
                  source={require("@/assets/images/confirm-back.png")}
                  style={{
                    width: 58,
                    height: 30,
                    transform: [{ rotate: "180deg" }],
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Autocomplete Suggestions */}
        <View style={{flex:1, backgroundColor: "pink", height:100}}>
        <ScrollView style={{paddingBottom: 350, }}>
          {data.map((item) => (
            <TouchableOpacity onPress={()=>{console.log(`${item} pressed`)}} key={item} style={{padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#ccc", flexDirection: "row", justifyContent: "flex-start", alignItems: "center"}}>
              <Image source={require("@/assets/images/dropdown-location.png")} style={{width: 35, height: 35}} />
              <View style={{width: 10}} />
              <Text style={{fontSize: 16, fontWeight: "bold"}}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        </View>

      </BottomDrawer>
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
}
