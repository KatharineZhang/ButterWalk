import React, {useState} from 'react';
import { View, Pressable, Text, Modal, StyleSheet, TextInput, Keyboard, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { TouchableWithoutFeedback } from '@gorhom/bottom-sheet';
type FlaggingProps = {
  onFlag: (reason: string) => void;
  closePopUp: () => void; // Optional prop to close the popup after flagging
};

// commented out for later use:
// const FLAG_REASONS = ["Add potential reasons here! "] as const;
// removed onFlag since we are not using reasons currently
export default function Flagging({ closePopUp }: FlaggingProps) {
  // used for changing modal visibility or not
  const [modalVisible, setModalVisible] = useState(true);
  const [description, setDescription] = useState('');
  const closeFlag = () => {
    Keyboard.dismiss();
    closePopUp(); 
    setModalVisible(false);
  }
  const onSubmit = () => {
    if (description.trim() === '') { 
      Alert.alert('Error', 'Please provide a description.');
      return; // <--- if description is empty, the function stops here
    }
    closeFlag();
  }

  return (
    <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={closeFlag}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.centeredView}> 
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <View style={styles.headerTitleContainer}>
                <FontAwesome name="flag" size={20} color="#E53935" style={styles.flagIcon} />
                <Text style={styles.modalTitle}>Flag Student</Text>
              </View>
              <Pressable onPress={closeFlag} style={styles.closeButton}>
                <FontAwesome name="times" size={24} color="#666" />
              </Pressable>
          </View>
          <Text style={styles.descriptionLabel}>Provide a brief description</Text>
            <TextInput
              style={styles.textInput}
              multiline={true} // allows multiple lines of text
              numberOfLines={4} // initial height for 4 lines
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top" // aligns text to the top for multiline
            />
            <Pressable onPress={onSubmit} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // dims background
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20, // rounded corners as in the image
    padding: 25,
    alignItems: 'center',
    elevation: 5,
    width: '70%',
    height: '40%',
    maxWidth: 400, // max width for larger screens
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagIcon: {
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  descriptionLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    alignSelf: 'flex-start', // align to left
  },
  textInput: {
    width: '100%',
    minHeight: 175, // minimum height for the text area
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#4b2e83', // purple color
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignSelf: 'flex-end'
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

