/* eslint-disable @typescript-eslint/no-require-imports */
import { Text, StyleSheet, ScrollView, View, Modal, TouchableOpacity, Image } from "react-native";

interface FAQProps {
  isVisible: boolean;
  onClose: () => void;
}

function FAQ({ isVisible, onClose }: FAQProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={docstyles.centeredView}>
        <View style={docstyles.modalView}>
            <TouchableOpacity style={[docstyles.button, { position: 'absolute', right: 10, top: 10 }]}
            onPress={onClose}>
            <Image
              source={require("@/assets/images/faq-close.png")}
              style={{ width: 40, height: 40 }}
            />
            </TouchableOpacity>
          <ScrollView>
            <View style={{ height: 60 }} />
            <Text style={docstyles.header}>Husky ButterWalk FAQ</Text>
            <Text style={docstyles.subtitle}>University of Washington</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default FAQ;

const docstyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    //  backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#E4E2F0',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '100%', // Make the modal take up 90% of the screen width
    height: "100%",
    position: 'absolute',
    bottom: -100
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  header: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: "left"
  },
  subtitle: {
    paddingVertical: 10,
    fontSize: 20,
  }
});
