/* eslint-disable @typescript-eslint/no-require-imports */
import { styles } from "@/assets/styles";
import { View, Modal, ScrollView, TouchableOpacity, Image } from "react-native";

// the component that displays a list of frequently asked questions
// takes in props on if the modal should be shown and a function to close the modal
// this allows the modal to be controlled in an extrnal component
interface PopUpModalProps {
  isVisible: boolean;
  onClose: () => void;
  content: JSX.Element;
  type: "full" | "half";
}

function PopUpModal({ isVisible, onClose, content, type }: PopUpModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end", // align modal to bottom
        }}
      >
        <View
          style={
            type === "full" ? styles.fullModalView : styles.bottomModalView
          }
        >
          {type === "full" && (
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Image
                source={require("@/assets/images/modal-close.png")}
                style={{ width: 40, height: 40 }}
              />
            </TouchableOpacity>
          )}
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            {content}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default PopUpModal;
