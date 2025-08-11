import React, { useState } from "react";
import {
  View,
  Pressable,
  Text,
  Modal,
  TextInput,
  Keyboard,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { TouchableWithoutFeedback } from "@gorhom/bottom-sheet";
import { driverFlagPopupStyles } from "assets/styles";
type FlaggingProps = {
  onFlag: (reason: string) => void;
  closePopUp: () => void; // Optional prop to close the popup after flagging
};

// const FLAG_REASONS = ["Add potential reasons here! "] as const;
// commented out for later use^^

export default function Flagging({ onFlag, closePopUp }: FlaggingProps) {
  const [modalVisible, setModalVisible] = useState(true);
  const [description, setDescription] = useState("");
  // helper method to help close the flag popup; this combines the
  // passed in closePopUp() method, as well as dismissing the
  // keyboard (done for better UI design)
  const onCloseFlag = () => {
    Keyboard.dismiss();
    closePopUp();
    setModalVisible(false);
  };

  // specific helper method for when the submit button is clicked,
  // calls onCloseFlag as long as an empty description isn't submitted
  const onSubmit = () => {
    if (description.trim() === "") {
      Alert.alert("Error", "Please provide a description.");
      return;
    }
    onFlag(description);
    onCloseFlag();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={onCloseFlag}
    >
      {/* below helps for the keyboard to disappear once the driver is done with the flag*/}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={driverFlagPopupStyles.centeredView}>
          <View style={driverFlagPopupStyles.modalView}>
            <View style={driverFlagPopupStyles.modalHeader}>
              <View style={driverFlagPopupStyles.headerTitleContainer}>
                {/* using FontAwesome for the flag and X icon */}
                <FontAwesome
                  name="flag"
                  size={20}
                  color="#E53935"
                  style={driverFlagPopupStyles.flagIcon}
                />
                <Text style={driverFlagPopupStyles.modalTitle}>
                  Flag Student
                </Text>
              </View>
              <Pressable
                onPress={onCloseFlag}
                style={driverFlagPopupStyles.closeButton}
              >
                <FontAwesome name="times" size={22} color="#666" />
              </Pressable>
            </View>
            <Text style={driverFlagPopupStyles.descriptionLabel}>
              Provide a brief description:
            </Text>
            <TextInput
              style={driverFlagPopupStyles.textInput}
              multiline={true} // allows multiple lines of text
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top" // aligns text to the top for multiline
            />
            <Pressable
              onPress={onSubmit}
              style={driverFlagPopupStyles.submitButton}
            >
              <Text style={driverFlagPopupStyles.submitButtonText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
