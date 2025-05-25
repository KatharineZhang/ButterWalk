/* eslint-disable @typescript-eslint/no-require-imports */
import { JSX, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  TouchableOpacity,
} from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
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
  Coordinates,
  getBuildingNames,
} from "@/services/BuildingService";
import {
  WebSocketResponse,
  SnapLocationResponse,
  ErrorResponse,
  DistanceResponse,
  LocationType,
  PlaceSearchResponse,
  PlaceSearchResult,
} from "../../server/src/api";
import WebSocketService from "../services/WebSocketService";
import { CampusZone, PurpleZone } from "@/services/ZoneService";

type RideRequestFormProps = {
  pickUpLocationNameChanged: (location: string) => void;
  dropOffLocationNameChanged: (location: string) => void;
  pickUpLocationCoordChanged: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  dropOffLocationCoordChanged: (location: {
    latitude: number;
    longitude: number;
  }) => void;
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
  recentLocations: LocationType[];
};

export default function RideRequestForm({
  pickUpLocationNameChanged,
  dropOffLocationNameChanged,
  pickUpLocationCoordChanged,
  dropOffLocationCoordChanged,
  userLocation,
  rideRequested,
  startingState,
  setFAQVisible,
  recentLocations,
  setNotificationState,
  updateSideBarHeight,
}: RideRequestFormProps) {
  /* STATE */
  // user input states for form
  const [chosenPickup, setChosenPickup] = useState(""); // the chosen pickup name
  // coordinates of the chosen pickup location
  const [pickupCoordinates, setPickupCoordinates] = useState({
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
  });
  const [chosenDropoff, setChosenDropoff] = useState(""); // the chosen dropoff name
  // the chosen dropoff coordinates
  const [dropoffCoordinates, setDropoffCoordinates] = useState({
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
  });
  // the number of riders
  const [numRiders, setNumRiders] = useState(1);

  // which panel in the ride request family of screens to show
  const [whichPanel, setWhichPanel] = useState<
    "RideReq" | "NumberRiders" | "LocationSuggestions"
  >("RideReq");

  // Bottom Sheet Reference needed to expand the bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Confirmation Modal
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);

  // what the user types in to the text boxes
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

  // the user clicked a dropdown location
  const allBuildings = getBuildingNames();
  const [campusAPIResults, setCampusAPIResults] = useState<string[]>([]);
  const [placeSearchResults, setPlaceSearchResults] = useState<
    PlaceSearchResult[]
  >([]);

  // the user clicked a dropdown result
  // figure out if it was a pickup or dropoff and call the right function
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
  const handleSetLocation = async (value: string) => {
    // check that does not allow location and destination to be the same
    if (value === chosenDropoff) {
      alert("Pickup location and destination cannot be the same!");
      return;
    }
    // the user clicked current location
    // we now need to figure out what the closest location is
    if (value === "Current Location") {
      // check if user is in the purple zone
      const insidePurpleZone = PurpleZone.isPointInside(userLocation);
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
          console.log("location snapping!");
          // call our new route

          WebSocketService.send({
            directive: "SNAP",
            currLat: userLocation.latitude,
            currLong: userLocation.longitude,
          });
        } else {
          // otherwise, store the closest building
          setClosestBuilding(closestCampusBuilding.name);
          // show the confirmation modal to let the user know where they are being snapped to
          setConfirmationModalVisible(true);
        }
      }
    } else {
      // the user clicked from recent location dropdown location
      setChosenPickup(value);
      let pickupCoord: Coordinates;

      // check if the clicked locations was a place search result
      const placeSearchOptionClicked = placeSearchResults.find(
        (item) => item.name === value
      );
      const recentLocOptionClicked = recentLocations.find(
        (item) => item.name === value
      );
      if (placeSearchOptionClicked) {
        // if it was, we can just use the coordinates attached to it
        pickupCoord = placeSearchOptionClicked.coordinates;
      } else if (recentLocOptionClicked) {
        // use the address to get the coordinates
        pickupCoord = recentLocOptionClicked.coordinates;
      } else {
        // otherwise the clicked location was a campus API result
        pickupCoord =
          await BuildingService.getClosestBuildingEntranceCoordinates(
            value,
            userLocation
          );
      }
      setPickupCoordinates(pickupCoord);

      // tell the home page that the pickup location has changed
      pickUpLocationNameChanged(value);
      pickUpLocationCoordChanged(pickupCoord);
    }
  };

  // user clicked a destination dropdown
  const handleSetDestination = async (value: string) => {
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
    let dropoffCoord: Coordinates;

    // check if the clicked locations was a place search result
    const placeSearchOptionClicked = placeSearchResults.find(
      (item) => item.name === value
    );
    const recentLocOptionClicked = recentLocations.find(
      (item) => item.name === value
    );
    if (placeSearchOptionClicked) {
      // if it was, we can just use the coordinates attached to it
      dropoffCoord = placeSearchOptionClicked.coordinates;
    } else if (recentLocOptionClicked) {
      // use the address to get the coordinates
      dropoffCoord = recentLocOptionClicked.coordinates;
    } else {
      // otherwise the clicked location was a campus API result
      dropoffCoord =
        await BuildingService.getClosestBuildingEntranceCoordinates(
          value,
          userLocation
        );
    }

    setDropoffCoordinates(dropoffCoord);

    // tell the home page that the dropoff location has changed
    dropOffLocationNameChanged(value);
    dropOffLocationCoordChanged(dropoffCoord);
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

  /* SCREEN NAVIGATION FUNCTIONS */

  // go to the number of riders screen
  // this is a method because we want to do some checks first
  const goToNumberRiders = () => {
    if (chosenPickup == "" || chosenDropoff == "") {
      alert("Please specify a pickup and dropoff location!");
      return;
    }

    // Both location should be in the purple zone
    // check that at least one location is on campus
    if (
      !CampusZone.isPointInside(pickupCoordinates) &&
      !CampusZone.isPointInside(dropoffCoordinates)
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
    pickUpLocationNameChanged(closestBuilding);
    const pickupCoord = BuildingService.getClosestBuildingEntranceCoordinates(
      closestBuilding,
      userLocation
    );
    setPickupCoordinates(pickupCoord);
    pickUpLocationCoordChanged(pickupCoord);
    setConfirmationModalVisible(false);
  };

  // the user clicked one of the suggested closest buildings
  const selectTopThreeBuilding = (buildingName: string) => {
    setPickUpQuery(buildingName);
    setChosenPickup(buildingName);
    pickUpLocationNameChanged(buildingName);
    const pickupCoord = BuildingService.getClosestBuildingEntranceCoordinates(
      closestBuilding,
      userLocation
    );
    setPickupCoordinates(pickupCoord);
    pickUpLocationCoordChanged(pickupCoord);
    setWhichPanel("RideReq");
  };

  // the user clicked back on the suggested closest buildings panel
  const hideLocationSuggestions = () => {
    setCurrentQuery("pickup");
    setPickUpQuery("");
    setWhichPanel("RideReq");
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

  // handle the snap location response
  const handleSnapLocationQuery = (message: WebSocketResponse) => {
    if ("response" in message && message.response == "SNAP") {
      const snapResp = message as SnapLocationResponse;

      if (snapResp.success) {
        const roadName = snapResp.roadName;
        if (roadName == "") {
          pickUpLocationNameChanged("Current Location"+"*");
          setChosenPickup("Current Location"+"*");
          setPickUpQuery("Current Location"+"*");
        } else {
          pickUpLocationNameChanged(roadName+"*");
          setChosenPickup(roadName+"*");
          setPickUpQuery(roadName+"*");
        }
        // set the coordinates to the snapped location (send it back to home component)
          pickUpLocationCoordChanged({
            latitude: snapResp.latitude,
            longitude: snapResp.longitude,
          });
      }
    } else {
      // there was a signin related error
      const errorResp = message as ErrorResponse;

      console.error("Error: ", errorResp.error);
    }
  };

  // Calls Place Search API when the user presses enter
  const enterPressed = async () => {
    const text = currentQuery == "pickup" ? pickUpQuery : dropOffQuery;
    if (text.length > 3) {
      WebSocketService.send({
        directive: "PLACE_SEARCH",
        query: text,
      });
    }
  };

  // handle the place search results
  const handlePlaceSearchResults = (message: WebSocketResponse) => {
    if ("response" in message && message.response === "PLACE_SEARCH") {
      const placeSearchResp = message as PlaceSearchResponse;
      // update the place search results
      setPlaceSearchResults(placeSearchResp.results);
    } else {
      console.error("Error fetching place search results");
    }
  };

  /* USE EFFECTS */
  // upon first render, set up the state
  useEffect(() => {
    // add the listener for the distance response
    WebSocketService.addListener(handleDistanceTopThree, "DISTANCE");
    // listen for the snap location response
    WebSocketService.addListener(handleSnapLocationQuery, "SNAP");
    // listen for the place search results
    WebSocketService.addListener(handlePlaceSearchResults, "PLACE_SEARCH");

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

  // update the campus API suggestions based on the user's query
  useEffect(() => {
    if (
      (currentQuery == "pickup" && pickUpQuery == "") ||
      (currentQuery == "dropoff" && dropOffQuery == "")
    ) {
      setCampusAPIResults([]);
      setPlaceSearchResults([]);
      return;
    }
    // Filter the Campus API Results based on the current query
    const filteredBuildings = allBuildings
      .filter((item) => {
        // if the current query is dropoff, filter out current location
        if (currentQuery == "dropoff") {
          return item !== "Current Location";
        } else {
          return true;
        }
      })
      // then filter based on the query
      // based on if it includes the
      .filter(
        (item) =>
          item
            .toLowerCase()
            .includes(
              currentQuery == "pickup"
                ? pickUpQuery.toLowerCase()
                : dropOffQuery.toLowerCase()
            ) ||
          (currentQuery == "pickup" && item == "Current Location") // if the current query is pickup, we want to include current location
      );
    setCampusAPIResults(filteredBuildings);
  }, [dropOffQuery, pickUpQuery]);

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
                enterPressed={enterPressed}
                placeholder="Pick Up Location"
                data={campusAPIResults}
              />
              <AutocompleteInput
                onPress={() => {
                  setCurrentQuery("dropoff");
                  expand();
                }}
                query={dropOffQuery}
                setQuery={setDropOffQuery}
                enterPressed={enterPressed}
                placeholder="Drop Off Location"
                data={campusAPIResults}
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
            {/* Add the Current Location to the Top of the results*/}
            {currentQuery == "pickup" && (
              <TouchableOpacity
                onPress={() => handleSelection("Current Location")}
                key={"Current Location"}
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ccc",
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    borderRadius: 50,
                    backgroundColor: "#EEEEEE",
                    width: 35,
                    height: 35,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FontAwesome6
                    name="location-crosshairs"
                    size={18}
                    color="black"
                  />
                </View>
                <View style={{ width: 10 }} />
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  Current Location
                </Text>
              </TouchableOpacity>
            )}
            {/* Then render any campus API results*/}
            {campusAPIResults.map((item) => (
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
                <View
                  style={{
                    borderRadius: 50,
                    backgroundColor: "#EEEEEE",
                    width: 35,
                    height: 35,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FontAwesome6
                    name="building-columns"
                    size={18}
                    color="black"
                  />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ maxWidth: "80%" }}>
                  <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    {item}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {/* Then show the place search results */}
            {placeSearchResults
              .filter((item) => !campusAPIResults.includes(item.name))
              .map((item) => (
                <TouchableOpacity
                  onPress={() => handleSelection(item.name)}
                  key={item.name}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#ccc",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      borderRadius: 50,
                      backgroundColor: "#EEEEEE",
                      width: 35,
                      height: 35,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesome6 name="location-dot" size={18} color="black" />
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ maxWidth: "80%" }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 14 }}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            {/* If there are no campuse or place search results or the user hasn't typed anything yet,
            show the recent locations results*/}
            {placeSearchResults.length == 0 &&
              campusAPIResults.length == 0 &&
              recentLocations.map((item) => (
                <TouchableOpacity
                  onPress={() => handleSelection(item.name)}
                  key={item.name}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#ccc",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      borderRadius: 50,
                      backgroundColor: "#EEEEEE",
                      width: 35,
                      height: 35,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="receipt" size={18} color="black" />
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ maxWidth: "80%" }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 14 }}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </BottomDrawer>
      {/* Confirmation Modal */}
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
