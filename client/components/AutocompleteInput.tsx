// Used for fuzze search in RideRequestForm component!
import React from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import Autocomplete from "react-native-autocomplete-input";
import { DropDownType } from "./RideRequestForm";

interface AutoCompleteInputProps {
  query: string;
  setQuery: (text: string) => void;
  setSelection: (text: DropDownType) => void;
  placeholder: string;
  data: DropDownType[];
}

const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({
  query,
  setQuery,
  setSelection,
  placeholder,
  data,
}) => {
  const [hideResults, setHideResults] = React.useState(true);

  const filteredData = data.filter(
    (item) =>
      // if the "Set location on map" is in data,
      // we always want to show this option regardless of the query
      item.toLowerCase().includes(query.toLowerCase()) ||
      item === "Current Location"
  );

  return (
    <View style={styles.autocompleteContainer}>
      <Autocomplete
        inputContainerStyle={styles.inputContainer}
        data={filteredData}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setHideResults(false);
        }}
        onSubmitEditing={() => setHideResults(true)}
        hideResults={hideResults}
        placeholder={placeholder}
        placeholderTextColor="#888"
        renderTextInput={(props) => (
          <TextInput
            {...props}
            placeholder={placeholder}
            placeholderTextColor="#888"
          />
        )}
        flatListProps={{
          keyExtractor: (_, idx) => idx.toString(),
          renderItem: ({ item }) => (
            <Pressable
              onPress={() => {
                setQuery(item);
                setSelection(item);
                setHideResults(true);
              }}
              style={styles.dropdownItem}
            >
              <Text>{item}</Text>
            </Pressable>
          ),
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  autocompleteContainer: {
    position: "relative",
    zIndex: 100,
    paddingBottom: 16,
  },
  inputContainer: {
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderColor: "#4B2E83",
    borderWidth: 2,
    backgroundColor: "white",
    overflow: "hidden",
    height: 60,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    fontSize: 16,
  },
});

export default AutoCompleteInput;
