import { StyleSheet, useWindowDimensions } from "react-native";

//More random styling things that I think i copied from chatgpt....
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
  },
  largeText: {
    fontSize: 25,
  },
  medText: {
    fontSize: 20,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#4B2E83",
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 16,
  },
  buttonContainer: {
    width: 320,
    height: 68,
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  page: {
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
  viewPager: {
    width: "100%",
    height: "90%",
  },
  footerButtonContainer: {
    position: "absolute",
    bottom: 5,
    left: 290,
    width: 80,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#4B2E83",
    opacity: 0.9,
  },
  footerButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#4B2E83",
  },
  headerButtonContainer: {
    position: "absolute",
    right: 10,
    top: 65,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "#4B2E83",
  },
  header: {
    height: "15%",
    width: "100%",
    paddingTop: 40,
    backgroundColor: "#D1AE49",
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    flex: 0.7,
    justifyContent: "center",
    alignContent: "center",
  },
  paginatorDot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#333",
    marginHorizontal: 8,
  },
});
