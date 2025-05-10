/* eslint-disable @typescript-eslint/no-require-imports */
import { JSX, useEffect, useRef, useState } from "react";
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
import {
  BuildingService,
  ComparableBuilding,
  getBuildingNames,
} from "@/services/campus";
import WebSocketService from "@/services/WebSocketService";
import { DistanceResponse, WebSocketResponse } from "../../server/src/api";
import { campus_zone, purple_zone } from "@/services/ZoneService";

type RideRequestFormProps = {
  pickUpLocationChanged: (location: string) => void;
  dropOffLocationChanged: (location: string) => void;
  userLocation: { latitude: number; longitude: number };
  rideRequested: (numPassengers: number) => void;
  setFAQVisible: (visible: boolean) => void;
  setNotificationState: (state: {
    text: string;
    color: string;
    boldText?: string;
  }) => void;
  startingState?: { pickup: string; dropoff: string; numRiders: number };
};

export default function RideRequestForm({
  pickUpLocationChanged,
  dropOffLocationChanged,
  // userLocation,
  rideRequested,
  startingState,
  setFAQVisible,
  setNotificationState,
}: RideRequestFormProps) {
  const userLocation = {latitude: 47.66132384329313, longitude:-122.31394842987012}

  // user input states for form
  const [location, setLocation] = useState(""); // the chosen pickup
  const [destination, setDestination] = useState(""); // the chosen dropoff
  const [numRiders, setNumRiders] = useState(1);

  // show the number of riders component or no
  const [showNumberRiders, setShowNumberRiders] = useState(false);

  // Bottom Sheet Reference needed to expand the bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    // add the listener for the distance response
    WebSocketService.addListener(handleDistanceTopThree, "DISTANCE");
    // if there is a starting state, set the location and destination
    if (startingState) {
      setLocationQuery(startingState.pickup);
      setLocation(startingState.pickup);
      setDestinationQuery(startingState.dropoff);
      setDestination(startingState.dropoff);
      setNumRiders(startingState.numRiders);
      // show the number of riders modal
      setShowNumberRiders(true);
    }
    // cleanup function to remove the listener
    return () => {
      WebSocketService.removeListener(handleDistanceTopThree, "DISTANCE");
    };
  }, []);

  // Confirmation Modal
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);

  // go to the number of riders screen
  const goToNumberRiders = () => {
    if (location == "" || destination == "") {
      alert("Please specify a pickup and dropoff location!");
      return;
    }

    const locationCoord = BuildingService.getBuildingCoordinates(location);
    const destCoord = BuildingService.getBuildingCoordinates(destination);

    // TODO: for this to work, we need to finetune the purple zone
    // check that both locations are within the purple zone
    // if (
    //   !purple_zone.isPointInside(locationCoord) ||
    //   !purple_zone.isPointInside(destCoord)
    // ) {
    //   // the pickup or dropoff is not in the purple zone
    //   alert(
    //     "Both the Pickup and Dropoff locations must be in the SafeTrip servicable area!"
    //   );
    //   return;
    // }

    // check that at least 1 location is on campus
    if (
      !campus_zone.isPointInside(locationCoord) &&
      !campus_zone.isPointInside(destCoord)
    ) {
      alert("Either the Pickup or Dropoff location must be on campus!");
      return;
    }
    setShowNumberRiders(true);
  };

  /* FUZZY SEARCH BAR STUFF */

  // Autocomplete for Location and Destination
  const [locationQuery, setLocationQuery] = useState(""); // Location query
  const [destinationQuery, setDestinationQuery] = useState(""); // Destination query

  // which text box is currently being updated
  const [currentQuery, setCurrentQuery] = useState<"pickup" | "dropoff">(
    "pickup"
  );

  // if the user clicks current location on campus, give them the closest Building
  const [closestBuilding, setClosestBuilding] = useState<string>("");
  // if the user clicks current location when not in purple zone, give them suggestions
  // useRef will allow of synchronous storage of these buildinsg
  const topThreeBuildings = useRef<ComparableBuilding[]>([]);
  // show the location suggestion component
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // data from LocationService.ts
  const data: string[] = getBuildingNames();
  data.unshift("Current Location"); // add current location to the beginning

  const handleSelection = (value: string) => {
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

  // user clicked a pickup dropdown
  const handleSetLocation = (value: string) => {
    // check that does not allow location and destination to be the same
    if (value === destination) {
      alert("Pickup location and destination cannot be the same!");
      return;
    }
    if (value === "Current Location") {
      // if the user is outside the purple zone, get the three closest buildings
      const insidePurpleZone = purple_zone.isPointInside(userLocation);
      if (!insidePurpleZone) {
        const comparableBuildings =
          BuildingService.topThreeClosestBuildings(userLocation);
        if (comparableBuildings === null) {
          // The method failed to get closest buildings
          console.log("topThreeClosestBuildings failed");
        } else {
          // comparableBuildings as ComparableBuilding[]
          // show the popup modal with the three closest buildings
          topThreeBuildings.current = comparableBuildings;
          // call the WebSocket service to get the distance to the three closest buildings
          WebSocketService.send({
            directive: "DISTANCE",
            origin: [userLocation],
            destination: comparableBuildings.map(
              (building) => building.building.location
            ),
            mode: "walking",
            tag: "topThreeClosestBuildings",
          });
        }
      } else {
        // the user is in the purple zone, so we need to snap the location to the closest building
        const closestCampusBuilding =
          BuildingService.closestBuilding(userLocation);
        if (closestCampusBuilding === null) {
          // do location snapping
          console.log("location snapping!");
        } else {
          setClosestBuilding(closestCampusBuilding.name);
        }
        setConfirmationModalVisible(true);
      }
    } else {
      // we clicked a normal location
      setLocation(value);
      pickUpLocationChanged(value as LocationName);
    }
  };

  // user clicked a destination dropdown
  const handleSetDestination = (value: string) => {
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
    setLocationQuery(closestBuilding);
    setLocation(closestBuilding);
    pickUpLocationChanged(closestBuilding);
    setConfirmationModalVisible(false);
  };

  const selectTopThreeBuilding = (buildingName: string) => {
    setLocationQuery(buildingName);
    setLocation(buildingName);
    pickUpLocationChanged(buildingName as LocationName);
    setShowLocationSuggestions(false);
  };

  const hideLocationSuggestions = () => {
    setCurrentQuery("pickup");
    setLocationQuery("");
    setShowLocationSuggestions(false);
  };

  const handleDistanceTopThree = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "DISTANCE") {
      const distanceResp = message as DistanceResponse;
      if (distanceResp.tag === "topThreeClosestBuildings") {
        // update the walk duration for the top three buildings
        const before = topThreeBuildings.current;
        const updatedBuildings = before.map((building, i) => {
          const walkSeconds =
            distanceResp.apiResponse.rows[0].elements[i].duration.value;
          const walkMinutes = Math.floor(walkSeconds / 60);

          return { ...building, walkDuration: walkMinutes };
        });
        topThreeBuildings.current = updatedBuildings;

        // now we can show the location suggestions
        setNotificationState({
          text: "You are not within service area.\nPlease select a nearby location that is.",
          color: "#FFEFB4",
        });
        setShowLocationSuggestions(true);
      }
    } else {
      console.log("Distance response error: ", message);
    }
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
      <PopUpModal
        type="half"
        isVisible={confirmationModalVisible}
        onClose={() => setConfirmationModalVisible(false)}
        content={
          <View style={{ padding: 20 }}>
            <Text style={styles.formHeader}>Confirm Pickup Location</Text>
            <Text style={styles.description}>
              Setting your pickup location to: {closestBuilding}
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

  const LocationSuggestions: JSX.Element = (
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
          marginHorizontal: 2,
          paddingBottom: 20,
          borderBottomColor: "#ccc",
          borderBottomWidth: 1,
        }}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => hideLocationSuggestions()}>
          <Ionicons name="arrow-back" size={30} color="#4B2E83" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
          Suggested Pick Up Locations
        </Text>

        {/* faq button */}
        <TouchableOpacity onPress={() => setFAQVisible(true)}>
          <Ionicons name="information-circle-outline" size={25} color="black" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />

      {/* Top Three Closest Buildings */}
      {topThreeBuildings.current.map((comparable, index) => (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 16,
            paddingHorizontal: 24,
            height: 79,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "#4B2E83",
            marginBottom: 10,
          }}
          key={index}
        >
          <TouchableOpacity
            style={{ alignItems: "center", justifyContent: "center" }}
            onPress={() => {
              selectTopThreeBuilding(comparable.building.name);
            }}
          >
            {/* Name of the building */}
            <Text style={{ fontSize: 18, color: "#4B2E83" }}>
              {comparable.building.name}
            </Text>
            <View style={{ height: 8 }} />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Description Text */}
              <Text
                style={{
                  fontSize: 15,
                  color: "#4B2E83",
                  fontStyle: "italic",
                  fontWeight: "bold",
                }}
              >
                {comparable.walkDuration}{" "}
              </Text>
              <Text
                style={{ fontSize: 15, color: "#4B2E83", fontStyle: "italic" }}
              >
                min walk{" "}
              </Text>
              {index == 0 && (
                <Text
                  style={{
                    fontSize: 15,
                    color: "#4B2E83",
                    fontStyle: "italic",
                  }}
                >
                  - closest
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: 10 }} />
    </View>
  );

  return showNumberRiders
    ? NumberRiders
    : showLocationSuggestions
      ? LocationSuggestions
      : RideRequest;
}
