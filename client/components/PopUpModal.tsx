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
      <TouchableOpacity
        style={styles.modalCenteredView}
        activeOpacity={1}
        onPressOut={onClose} // close modal when user clicks outside of it
      >
        <View style={styles.modalModalView}>
          {/* Close Button */}
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
          {/* Whatever is inside the modal */}
          {content}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default PopUpModal;
