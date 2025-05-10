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
  updateSideBarHeight: (bottom: number) => void;
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
  userLocation,
  rideRequested,
  startingState,
  setFAQVisible,
  setNotificationState,
  updateSideBarHeight,
}: RideRequestFormProps) {
  /* STATE */
  // user input states for form
  const [chosenPickup, setChosenPickup] = useState(""); // the chosen pickup
  const [chosenDropoff, setChosenDropoff] = useState(""); // the chosen dropoff
  const [numRiders, setNumRiders] = useState(1);

  // which panel to show
  const [whichPanel, setWhichPanel] = useState<
    "RideReq" | "NumberRiders" | "LocationSuggestions"
  >("RideReq");

  // Bottom Sheet Reference needed to expand the bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Confirmation Modal
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);

  const [pickUpQuery, setPickUpQuery] = useState(""); // Typed in pickup query
  const [dropOffQuery, setDropOffQuery] = useState(""); // typed in dropoff query

  // which text box is currently being updated
  const [currentQuery, setCurrentQuery] = useState<"pickup" | "dropoff">(
    "pickup"
  );

  // if the user clicks current location on campus, give them the closest Building
  const [closestBuilding, setClosestBuilding] = useState<string>("");
  // if the user clicks current location when not in purple zone, give them suggestions
  // useRef will allow of synchronous storage of these buildinsg
  const topThreeBuildings = useRef<ComparableBuilding[]>([]);

  // the set of results to show in the dropdown
  const data: string[] = getBuildingNames();
  data.unshift("Current Location"); // add current location to the beginning

  /* METHODS */
  // the user clicked a dropdown result
  const handleSelection = (value: string) => {
    if (currentQuery === "pickup") {
      setPickUpQuery(value);
      //switch to dropoff
      setCurrentQuery("dropoff");
      handleSetLocation(value);
    } else {
      setDropOffQuery(value);
      handleSetDestination(value);
    }
  };

  // user clicked a pickup dropdown
  const handleSetLocation = (value: string) => {
    // check that does not allow location and destination to be the same
    if (value === chosenDropoff) {
      alert("Pickup location and destination cannot be the same!");
      return;
    }
    // the user clicked current location
    // we now need to figure out what the closest location is
    if (value === "Current Location") {
      // check if user is in the purple zone
      const insidePurpleZone = purple_zone.isPointInside(userLocation);
      // if the user is outside the purple zone, get the three closest buildings
      if (!insidePurpleZone) {
        // call the campus api to get the 3 closest buildins
        const comparableBuildings =
          BuildingService.topThreeClosestBuildings(userLocation);
        // if nothing was returned
        if (comparableBuildings === null) {
          // The method failed to get closest buildings
          console.log("topThreeClosestBuildings failed");
        } else {
          // store our three closest buildings
          if (
            topThreeBuildings.current.length > 0 &&
            Math.abs(
              topThreeBuildings.current[0].distance -
                comparableBuildings[0].distance
            ) < 0.2
          ) {
            // if the top three buildings are the same as before
            // and the distance is the same, then
            // we can assume the user is in the same location
            // do not call the websocket again
            checkIfTooFarAway();
            return;
          }
          // otherwise, we have new buildings
          topThreeBuildings.current = comparableBuildings;
          // call the websocket to get the distance from the user
          // to the three closest buildings
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
        // the user is in the purple zone,
        // so we need to snap the location to the closest building or street

        // first try to get a closest building
        const closestCampusBuilding =
          BuildingService.closestBuilding(userLocation);
        // if no building was close enough
        if (closestCampusBuilding === null) {
          // do location snapping
          console.log("location snapping!");
        } else {
          // otherwise, store the closest building
          setClosestBuilding(closestCampusBuilding.name);
        }
        // show the confirmation modal to let the user know where they are being snapped to
        setConfirmationModalVisible(true);
      }
    } else {
      // the user clicked a normal dropdown location
      setChosenPickup(value);
      pickUpLocationChanged(value);
    }
  };

  // user clicked a destination dropdown
  const handleSetDestination = (value: string) => {
    if (value === chosenPickup) {
      alert("Pickup location and dropoff location cannot be the same!");
      return;
    }
    if (value === "Current Location") {
      console.log(
        "Something went wrong! can't set dropoff location to user location"
      );
      return;
    }
    setChosenDropoff(value);
    dropOffLocationChanged(value);
  };

  // go to the number of riders screen
  // this is a method because we want to do some checks first
  const goToNumberRiders = () => {
    if (chosenPickup == "" || chosenDropoff == "") {
      alert("Please specify a pickup and dropoff location!");
      return;
    }

    const pickupCoordinates =
      BuildingService.getBuildingCoordinates(chosenPickup);
    const dropoffCoordinates =
      BuildingService.getBuildingCoordinates(chosenDropoff);

    // TODO: for this to work, we need to finetune the purple zone
    // to work with the pockets of purple zone
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

    // check that at least one location is on campus
    if (
      !campus_zone.isPointInside(pickupCoordinates) &&
      !campus_zone.isPointInside(dropoffCoordinates)
    ) {
      alert("Either the pickup or dropoff location must be on campus!");
      return;
    }
    setWhichPanel("NumberRiders");
  };

  // the user clicked confirm on the confirmation modal
  const confirmPickUpLocation = () => {
    setPickUpQuery(closestBuilding);
    setChosenPickup(closestBuilding);
    pickUpLocationChanged(closestBuilding);
    setConfirmationModalVisible(false);
  };

  // the user clicked one of the suggested closest buildings
  const selectTopThreeBuilding = (buildingName: string) => {
    setPickUpQuery(buildingName);
    setChosenPickup(buildingName);
    pickUpLocationChanged(buildingName);
    setWhichPanel("RideReq");
  };

  // the user clicked back on the suggested closest buildings panel
  const hideLocationSuggestions = () => {
    setCurrentQuery("pickup");
    setPickUpQuery("");
    setWhichPanel("RideReq");
  };

  // check if the user is too far away to offer service
  const checkIfTooFarAway = () => {
    if (
      topThreeBuildings.current.length > 0 &&
      topThreeBuildings.current[0].walkDuration > 15
    ) {
      setNotificationState({
        text: "You are too far from the servicable area.",
        color: "#FFCBCB",
      });
      setTimeout(() => {
        setNotificationState({ text: "", color: "" });
      }, 6000);

      setPickUpQuery("");
      setChosenPickup("");
      setCurrentQuery("pickup");
      return;
    }

    // else, we can show the location suggestions panel
    setWhichPanel("LocationSuggestions");
    // send the user a notification
    setNotificationState({
      text: "You are not within service area.\nPlease select a nearby location that is.",
      color: "#FFEFB4",
    });
  };

  /* WEBSOCKET */
  // handle the distance repsonse
  const handleDistanceTopThree = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "DISTANCE") {
      const distanceResp = message as DistanceResponse;

      // if this distance call is the one we were listening for
      // (currently we only listen for topThreeClosestBuildings)
      if (distanceResp.tag === "topThreeClosestBuildings") {
        // update the walk duration for the top three buildings we previously stored
        const before = topThreeBuildings.current;
        const updatedBuildings = before.map((building, i) => {
          const walkSeconds =
            distanceResp.apiResponse.rows[0].elements[i].duration.value;
          const walkMinutes = Math.floor(walkSeconds / 60);
          return { ...building, walkDuration: walkMinutes };
        });
        topThreeBuildings.current = updatedBuildings;
        checkIfTooFarAway();
      }
    } else {
      // the server sent us an error
      console.log("Distance response error: ", message);
    }
  };

  /* USE EFFECTS */
  // upon first render, set up the state
  useEffect(() => {
    // add the listener for the distance response
    WebSocketService.addListener(handleDistanceTopThree, "DISTANCE");

    // if there is a starting state,
    // that means the user clicked back from the confirm ride component
    // set the location and destination and show the number of riders panel
    if (startingState) {
      setPickUpQuery(startingState.pickup);
      setChosenPickup(startingState.pickup);
      setDropOffQuery(startingState.dropoff);
      setChosenDropoff(startingState.dropoff);
      setNumRiders(startingState.numRiders);
      // show the number of riders modal
      setWhichPanel("NumberRiders");
    }
    // cleanup function to remove the listener
    return () => {
      WebSocketService.removeListener(handleDistanceTopThree, "DISTANCE");
    };
  }, []);

  // modify the sidebar height based on the panel shown
  useEffect(() => {
    switch (whichPanel) {
      case "RideReq":
        updateSideBarHeight(350);
        break;
      case "NumberRiders":
        updateSideBarHeight(310);
        break;
      case "LocationSuggestions":
        updateSideBarHeight(400);
        break;
    }
  }, [whichPanel]);

  /* ANIMATION */
  const fadeAnim = useState(new Animated.Value(0))[0];

  // For each change to the number of riders, smoothen the animation
  const animateRiders = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle increase of riders
  const handleIncreaseRiders = () => {
    if (numRiders < 4) {
      setNumRiders(numRiders + 1);
      animateRiders();
    }
  };

  // Handle decrease of riders
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

  /* PANEL UI */
  // the ride request panel
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
                query={pickUpQuery}
                setQuery={setPickUpQuery}
                placeholder="Pick Up Location"
                data={data}
              />
              <AutocompleteInput
                onPress={() => {
                  setCurrentQuery("dropoff");
                  expand();
                }}
                query={dropOffQuery}
                setQuery={setDropOffQuery}
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
                        ? pickUpQuery.toLowerCase()
                        : dropOffQuery
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

  // number of riders panel
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
        <TouchableOpacity onPress={() => setWhichPanel("RideReq")}>
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

  // top three locations suggestions panel
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

  // render the correct panel based on our state
  return whichPanel == "NumberRiders"
    ? NumberRiders
    : whichPanel == "LocationSuggestions"
      ? LocationSuggestions
      : RideRequest;
}
