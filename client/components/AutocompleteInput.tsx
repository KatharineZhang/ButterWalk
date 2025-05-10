// Used for fuzze search in RideRequestForm component!
import React from "react";
import { View, StyleSheet, TextInput } from "react-native";

interface AutoCompleteInputProps {
  onPress: () => void;
  query: string;
  setQuery: (text: string) => void;
  placeholder: string;
  data: string[];
}

const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({
  onPress,
  query,
  setQuery,
  placeholder,
}) => {
  return (
    <View style={styles.autocompleteContainer}>
      <TextInput
        style={styles.inputContainer}
        value={query}
        onPress={onPress}
        onChangeText={(text) => {
          setQuery(text);
        }}
        placeholder={placeholder}
        placeholderTextColor="#888"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  autocompleteContainer: {
    position: "relative",
    zIndex: 100,
    paddingBottom: 7,
    width: "100%",
  },
  inputContainer: {
    borderRadius: 8,
    paddingVertical: 16,
    paddingLeft: 40,
    paddingRight: 20,
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
