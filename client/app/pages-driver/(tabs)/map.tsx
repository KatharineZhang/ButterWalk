import React, {useState, useEffect} from "react";
import MapView, { Marker, Heatmap } from "react-native-maps";
import { StyleSheet, View } from "react-native";
import MapViewDirections from "react-native-maps-directions";
import * as Location from 'expo-location';

// KATHARINE MADE A CHANGE


//right now the map shows but the console just has errors - i'm trying to get location 
  //before i show the map so that I can route directions from their location
    //i think this is going to require getting the location before going to the map page
        //TBD when I get it (pros and cons to each)
export default function App() {
  const [location, setLocation] = useState();
  //getting permissions to use their location (this is the popup thingie asking if we can use location)
  const getPermissions = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log("Please grant location permission");
      //it was telling me i couldn't return nothing, so this is just a garbage return
      return {location: 22, longitude: 33};
    }
    let currentLocation = await Location.getCurrentPositionAsync({});
    //print current user's location to console
      //this worked when i had this function in the useEffect(), but that only got the 
        //location when the page re-rendered, so i need a different plan
    console.log("Location: ");
    console.log(currentLocation);
    return {location: currentLocation.coords.latitude, longitude: currentLocation.coords.latitude}
  };
  //left useEffect() here because maybe it'll be useful someday? 
  //useEffect(() => {
  //call to get permissions:
  let destination = getPermissions();
  //}, []); 
  //fake destination from back when i was just trying to get the directions to work
  //const destination = {latitude: 37.771707, longitude: -122.4053769};
  //api key curtesey of snigdha (three cheers!!)
  const GOOGLE_MAPS_APIKEY = 'AIzaSyAi4GiqY4FUMk7CQWB0MxNQIGWOsr_laBw';
  //again, this is fake data (i was testing out putting markers on the map)
  const locationData = [
   // {latitude: lat, longitude: long},
    {latitude: 6.841776681, longitude: 79.869319},
    {latitude: 37.3318456, longitude: -122.0296002}, //san francisco
    {latitude: 37.771707, longitude: -122.4053769}, //near san jose
  ];
  
  return (
      //putting the map region on the screen
      <MapView style={styles.container} initialRegion={{
        latitude: 47.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}>
    {locationData.map((data, index) => (
      //putting the markers on the map
          <Marker
            key={index}
            coordinate={{
              latitude: data.latitude,
              longitude: data.longitude,
            }}
            title={`Marker ${index + 1}`}
          />
        ))}
      < MapViewDirections
      //doesn't work but hopefully someday this will route directions btwn the current location
        //and the target destination
          //we're gonna have to update this a lot as the current location changes 
            //google maps api doesn't have realtime updates as far as i could figure out :(
        destination={destination}
        apikey={GOOGLE_MAPS_APIKEY}
      />
   </MapView>
   );
}

//Styling stuff
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});