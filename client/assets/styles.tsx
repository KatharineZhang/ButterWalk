import { StyleSheet } from "react-native";

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
  viewOnboardingPager: {
    width: "100%",
    height: "90%",
  },
  onboardingFooterButtonContainer: {
    position: "absolute",
    bottom: 5,
    right : 20,
    elevation: 3,
    opacity: 0.9,
  },
  onboardingFooterButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 25,
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
    position: "absolute",
    top: 1,
    height: "15%",
    width: "100%",
    paddingTop: 40,
    backgroundColor: "#D1AE49",
    flexDirection: "row",
    alignItems: "center",
    zIndex:1
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
  map: {
    width: "100%",
    height: "100%",
  },
  mapContainer: {
    flex: 1
  }
});
