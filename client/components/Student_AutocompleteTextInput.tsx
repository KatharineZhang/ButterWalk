// Used for fuzzy search in RideRequestForm component!
import React from "react";
import { View, StyleSheet, TextInput } from "react-native";

interface AutoCompleteInputProps {
  focused: boolean;
  onPress: () => void;
  query: string;
  setQuery: (text: string) => void;
  enterPressed: () => void;
  placeholder: string;
}

const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({
  focused,
  onPress,
  query,
  setQuery,
  enterPressed,
  placeholder,
}) => {
  return (
    <View style={styles.autocompleteContainer}>
      <TextInput
        style={focused ? styles.focusInputContainer : styles.inputContainer}
        value={query}
        onPress={onPress}
        onChangeText={(text) => {
          setQuery(text);
        }}
        onSubmitEditing={enterPressed}
        placeholder={placeholder}
        placeholderTextColor="#888"
        autoComplete="off"
        autoCapitalize="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  autocompleteContainer: {
    zIndex: 3,
    marginBottom: 10,
    width: "100%",
  },
  focusInputContainer: {
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
  inputContainer: {
    borderRadius: 8,
    paddingVertical: 16,
    paddingLeft: 40,
    paddingRight: 20,
    backgroundColor: "#eeeeee",
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
