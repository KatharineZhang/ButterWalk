/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import { View, Modal, TouchableOpacity, Image } from "react-native";

// the component that displays a list of frequently asked questions
// takes in props on if the modal should be shown and a function to close the modal
// this allows the modal to be controlled in an extrnal component
interface PopUpModalProps {
  isVisible: boolean;
  onClose: () => void;
  content: JSX.Element;
}

function PopUpModal({ isVisible, onClose, content }: PopUpModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalCenteredView}>
        <View style={styles.modalModalView}>
          <TouchableOpacity
            style={[
              styles.modalCloseButton,
              { position: "absolute", right: 10, top: 10, zIndex: 1 },
            ]}
            onPress={onClose}
          >
            <Image
              source={require("@/assets/images/modal-close.png")}
              style={{ width: 40, height: 40 }}
            />
          </TouchableOpacity>
          {content}
        </View>
      </View>
    </Modal>
  );
}

export default PopUpModal;
